# AWS IoT - Quiz Demo

The purpose of this demo is to showcase the capabilities of IoT by developing a quiz game using Microcontrollers, connected to the cloud. Each player has a "buzzer" device, in which they can select the answer to a given question, by tapping one or other button. The cloud orchestrates all the game and the responses from the participants.

# Components

## Quiz Device

The Quiz devices are AWS Hexa-boards, with very similar compute functionalities to the ESP32 DevKitC. On top of the MCU we have a couple buttons - that we will use to submit the responses and for other interactions - and 6 RGB leds at the vertexes of the hexagon.

![AWS Hexa board](/static/board-img.png)

We will use [Mongoose OS](https://mongoose-os.com/) to program our microcontroller to do what we want it to do. You can find the code we will use for the devices on the `device/` folder.

These devices are connected to WiFi and the AWS IoT broker, to receive and transmit data updates in real time. This channel is used from the Cloud to send any status update, and from the device to report the responses to the questions - amongst other things.

![Quiz Architectural diagram](/static/arch-quiz.png)

The footprint needed for the device in the cloud to be able to work effectively includes the following resources:
* AWS IoT Thing.
* AWS IoT Policy.
* AWS IoT Certificate.

The policy is defined via a CloudFormation template - i.e. `infra/quiz-device.yaml`, that we will spin up before provisioning the devices. It gives enough permissions to the devices to exchange information with the cloud.

## Quiz dashboard

Apart from the devices, we need a dashboard that will be used to show and read the questions, and to manage attendees responses during a game's lifecycle. 

![Dashboard Architectural Diagram](/static/arch-dashboard.png)

The infrastructure required for this solution is also defined using CloudFormation templates, that we have split in several nested stacks for simplicity matters. You can find them on the `infra` folder:
* `dashboard-webapp.yaml`: Contains the web resources needed for this solution to work.
* `dashboard-users.yaml`: Contains the Cognito resources for authenticating and authorizing users.
* `dashboard-data.yaml`: Contains the Database(s) used in the quiz to store responses.
* `dashboard.yaml`: References the aforementioned stacks as nested stacks. This is the template we will use for spin up.

We will develop this dashboard using [Vue.js](https://vuejs.org/), more specifically the [Vue.js Webpack boilerplate](https://github.com/vuejs-templates/webpack), to get started quicker.

On the root folder, we have run the commands explained in the boilerplate repository:

```bash
$ npm install -g vue-cli
$ vue init webpack dashboard
$ cd dashboard
$ npm install
$ npm run dev
```

When running the last command, a development server will be started, and you should be able to see your web application at `http://localhost:8080`.

Before starting spinning up the infrastructure, there is a couple of manual tasks we need to execute on our AWS account:

### Admin information

As part of the infrastructure deployment, a user will be created for you and attached to the Administrators group. This will allow you to login into the system and have access to the administrative sections. To configure this user, change the values of the user email's address and the username in the CloudFormation template.

### CloudFront Origin Access Identity

When CloudFront consumes data from an S3 bucket, you can restrict the permissions to such bucket so only CloudFront - and any other authorized entities - can access the bucket's contents. This is achieved with CloudFront's [Origin Access Identities](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html).

![CloudFront OAIs](/static/cloudfront-oai.png)

You need to copy the two values - i.e. `ID` and `Amazon S3 Canonical User ID`, and paste them on the CloudFormation template.

Once these steps above are performed, we can spin up our template. It would take a while to finish - about ~15 minutes.

### Configuring domain name

Once the infrastructure finishes spinning up, you can deploy your dashboard so it's accessible to the public. In this demo we will use the domain name `iotquiz.experiments.cloud` as the webapp's address - you should change this value accordingly when deploying the demo yourself. Once we've selected our domain name, we may need to change some NS records on it so it points to the Hosted Zone we have created.

Once the domain is correctly setup, we could load our application by accessing it on a browser. However, upon loading the URL you may receive a warning saying that your certificate is not valid. This is due to using custom domains, without setting up a proper certificate that validates the identity of such domain name. We can create a certificate on Amazon Certificate Manager:

![Request a certificate in ACM](/static/acm-request.png)

You need to validate the ownership of the domain you're requesting a certificate for, either via Email or DNS. As we are using Route53 for our Hosted Zone, DNS validation is quite easy to perform:

![ACM Ownership validation](/static/acm-verify.png)

After your certificate status transitions to `Verified`, you can use the certificate arn for linking it to our webapp distribution, by pasting the value on the `CertificateArn` parameter of the CloudFormation template. Then we need to perform an stack update to adapt to these changes - it will also take some time.

### Configuring users resources

With the deployment of our last stack, we have created several resources that will be used for authenticating and authorizing users in your platform. This is handled mostly by [Amazon Cognito](https://aws.amazon.com/cognito/), that will store and manage your user base, and perform any auth/n tasks required for your users to consume your services.

There is a couple of manual steps we need to perform to finish configuring these resources:

#### Configure authentication providers

In the Cognito console you can configure how each User Pool Client interacts with its User Pool, and which authentication mechanisms it is allowed to perform:

![Cognito App Client configuration](/static/cognito-client-settings.png)

We need to enable Cognito as an enabled Identity Provider, and configure our login and logout URLs for our system - these URLs will be the only one authorized as callbacks from the login system upon any login/logout operation. Then we need to setup `implicit grant` as an allowed OAuth flow. Implicit grant allows Cognito to resolve Access Tokens directly and send them back to the application. We will use `openid`, `aws.cognito.signin.user.admin` and `profile` as authorized scopes.

#### Configure Custom domain

Once the authentication provider is set, we need to configure a domain for hosting our custom login UI. The login UI is handled by Cognito, which needs only an endpoint to host the application into. We will use our custom domain to host the login UI, in the subdomain `auth.iotquiz.experiments.cloud`.

![Cognito Custom domain](/static/cognito-domain-setup.png)

As we are using our custom domain, we need to create an alias recordset on our Hosted Zone to correctly resolve the DNS name of the auth system to the proper distribution URL. Copy the value of the Alias target for your login domain, and paste it in the `LoginDomainAliasTarget` parameter of the dashboard CloudFormation template.

![Cognito Alias setup](/static/cognito-domain-alias-setup.png)

Once we've pasted the value, we can update our CloudFormation stack to reflect these changes in your app.

### Starting with our UI

Now our dashboard infrastructure is fully ready, it's time to start working on our dashboard for being able to use it for the Quiz. We will cover this development in several sections.

#### Configuration

The UI needs to know about some of the infrastructure resources used for the solution, to be able to use them when needed - e.g. the Cognito configuration to successfully rely unauthenticated users to login. To manage this and other configuration parameters for the application, we will create a `ConfigurationService` in our app. It will lay on `dashboard/src/services/ConfigurationService.js`. 

We will store the actual values needed for our application within our dashboard's `assets/` folder, in a file name `config.json`. To avoid populating and maintaining these values manually, we will create a script that fetches the values from CloudFormation, and saves them in the config file. You will find this script at `scripts/configure-ui.sh`. Let's run the script to configure our UI.

```bash
$ bash scripts/configure-ui.sh
INFO: Configuring UI
INFO: Fetching deployment information.
INFO: Creating JSON configuration
INFO: Writing JSON configuration
$ 
```

If we take a look at our `config.json` file now we'll see the resource identifiers and required values in there. They will be used by the UI for several procedures - e.g. authentication.

#### Authentication

As our quiz is a private platform, only authorized users can access the system and play. We need to configure our UI to manage our credentials, and redirect us to login if we don't have any. The first thing we will create is another service, called `AuthService`. This service will handle all authentication and credential management tasks, and will be consumed by several parts of the application.

Upon **application loading**, we need to verify the existence of credentials, and redirect the users to our login UI if they either don't have credentials or they have expired. In Vue.js the application lifecycle is managed at the `src/App.vue` file, so it must be configured to perform this tasks on application creation.

Once the authentication provider is finished authenticating the user, it will redirect back to our `login` callback URL. We need to create a route in our application that handles these login requests and enables users to perform authenticated actions. We will create a `Login.vue` component and adapt Vue.js `router` to engage the component on the login route.

### The Quiz Dashboard

Once we've setup all our infrastructure and prepared our UI, is time to start developing the features of our amazing quiz app. Once the login succeeds and the app is loaded, the user will be redirected to the `/quiz` endpoint, which is where we will put our quiz game component.

We will start sketching the initial screen for our quiz, that will show the presentation of the quiz app, and list available quiz devices. The admin will be able to select devices, activating them for the game. When the admin clicks on a given device, the dashboard will send a message to the device requesting its activation. The player that uses such device needs to click on any of the buttons for finalizing this activation.

For managing connectivity with the devices, we will create a new service on our system - i.e. `DeviceService`, that will handle the exchange of information over AWS IoT. This service will be leveraged from our quiz component, to react to users actions.