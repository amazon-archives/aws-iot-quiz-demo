load('api_config.js');
load('api_rpc.js');
load('api_timer.js');
load('api_gpio.js');
load('api_sys.js');
load('api_spi.js');
load('api_aws.js');
load('api_mqtt.js');
load('api_grove.js');
load("api_adc.js");


let button1 = Cfg.get('awskit.button1');
let button2 = Cfg.get('awskit.button2');
let led = Cfg.get('awskit.led');
let spi = SPI.get();

let it = 0;
let state = {
  player: null,
  status: 'answer-ko'  
};

let lightmode = function(mode) {
  if (mode === 'idle') {
    light([0xff2798fd, 0xff2798fd, 0xff2798fd, 0xff2798fd, 0xff2798fd, 0xff2798fd]);
  } else if (mode === 'waiting-answer') {
    let color = it % 10 < 5 ? 0xffff0000 : 0xe0000000 ;
    let leds = [color, color, color, color, color, color];
    light(leds);
  } else if (mode === 'waiting-signal') {
    let leds = [0xe0000000, 0xe0000000, 0xe0000000, 0xe0000000, 0xe0000000, 0xe0000000];
    let index = it % 6;
    leds[index] = 0xffff0000;
    light(leds);
  } else if (mode === 'answer-ok') {
    light([0xff00ff00, 0xff00ff00, 0xff00ff00, 0xff00ff00, 0xff00ff00, 0xff00ff00]);
  } else if (mode === 'answer-ko') {
    light([0xff0000ff, 0xff0000ff, 0xff0000ff, 0xff0000ff, 0xff0000ff, 0xff0000ff]);
  }
};

/* Leds */

let light = function(ar) {
  let frame = '\x00\x00\x00\x00';
  for (let i = 0; i < ar.length; i++) {
    //print(typeof(ar[i]), ar[i]);
    frame += chr((ar[i] >> 24) & 0xff) + chr((ar[i] >> 16) & 0xff) +
      chr((ar[i] >> 8) & 0xff) + chr(ar[i] & 0xff);
  }
  frame += '\xff';
  //print('sending', JSON.stringify(ar));
  let result = SPI.runTransaction(spi, {
    mode: 3,
    freq: 1000000,
    cs: -1,
    hd: {
      tx_data: frame,
      tx_len: frame.length,
    }
  });
};

let syncState = function(desired) {
  print('INFO: Syncing state.')
  let changed = false;
  for (let key in state) {
    if (desired[key] === undefined) continue;
    if (desired[key] !== state[key]) {
      state[key] = desired[key];
      changed = true;
    }
  }

  if (changed) {
    print('INFO: Shadow information changed. Reporting.');
    AWS.Shadow.update(0, { reported: state });
  } else {
    print('INFO: No change performed on shadow.');
  }
};

AWS.Shadow.setStateHandler(function(data, event, reported, desired) {
  print('INFO: Shadow update received')

  if (event === AWS.Shadow.CONNECTED) {
    print('INFO: Connected to shadow')
  } else if (event === AWS.Shadow.UPDATE_DELTA) {
    print('INFO: Delta received')
    syncState(desired)
  } else if (event === 0 || event === 1) {
    syncState(desired)
  }
  print('aws handler, event', event, 'reported:', JSON.stringify(reported),
        'desired:', JSON.stringify(desired));
}, null);

print('INFO: Initializing loop.')
Timer.set(150, true, function() {
  lightmode(state.status)
  it++;
}, null);

  // Handle Led State

//   let handleLED = function(value) {
//   state.led = value;
//   if (state.led === "off") {
//     print('Turning LED off');
//     light([0xe0000000, 0xe0000000, 0xe0000000, 0xe0000000, 0xe0000000, 0xe0000000]);
//   } else if (state.led === "on") {
//     print('Turning LED on');
//     let leds = []; 
//     let col = Math.random();
//     for (let i = 0; i < 6; i++) {
//       leds.splice(leds.length, 0, col * 0xffffffff | 0xe0000000);
//     }
//     light(leds);
//   }
//   AWS.Shadow.update(0, {reported: state, desired: null});
// };


// print('*2*LED GPIO:', led, 'button1 GPIO:', button1, 'button1 GPIO:', button2);

// GPIO.set_mode(led, GPIO.MODE_OUTPUT);


// //Buton 1 ***********

// GPIO.set_button_handler(button1, GPIO.PULL_UP, GPIO.INT_EDGE_POS, 1000, function() {
//   GPIO.toggle(led);
  

//   let topic = Cfg.get('device.id') + '/light';
//   let sensorValue = Grove.LightSensor.get(34);
//   let message = JSON.stringify({
//   	light: JSON.stringify(sensorValue),
//     total_ram: Sys.total_ram(),
//     free_ram: Sys.free_ram()
//   });
//   let ok = MQTT.pub(topic, message, 1);
//   print('Published:', ok ? 'yes' : 'no', 'topic:', topic, 'message:', message);
  


//   GPIO.toggle(led);

  
// }, null);


// //*************

// GPIO.set_button_handler(button2, GPIO.PULL_UP, GPIO.INT_EDGE_POS, 1000, function() {
//  	//Toggle lights on device
//  	if(state.led === 'on'){
//  		state.led = 'off'
//  	}else{
//  		state.led = 'on'
//  	}

//  	handleLED(state.led);
  
// }, null);
