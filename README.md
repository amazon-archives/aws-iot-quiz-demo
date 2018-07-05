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