//
// Copyright 2015, Evothings AB
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

var timeVar
var dateVar
var alarmTime
alarmSet=false
j=0
$(document).ready(function() {
	
	
	$('#connectButton').click(function() {
		app.connect()
	})

	$('#disconnectButton').click(function() {
		app.disconnect()
	})

	$('#led').click(function(){
		app.ledOn()
	})	

	$(document).on('input','#HSlider',function(){
			
			app.sliderUpdate("H".concat(this.value))
		
	})	
	
	$(document).on('input','#SSlider',function(){
			
			app.sliderUpdate("S".concat(this.value))
		
	})	

	$(document).on('input','#VSlider',function(){
			
			app.sliderUpdate("V".concat(this.value))
		
	})	
	 $('#date').datepicker({
	
	 
	 });
	

	$('#time').timepicker({
		'dynamic': false,
		'dropdown': true,
	    'scrollbar': true,
		'step': 5,
		'altFormat': "yy-mm-dd",
		
	});
	
	$('#setDate').click(function() {
		 console.log('button clicked');
		 if (alarmSet==false){
			

			let msec = Date.parse(dateVar);
			const d = new Date(msec);
			alarmTime=$('#time').timepicker('getTime', d);

			
			if (alarmTime-new Date()>0){
				alarmSet=true;
				$('#setDate').html("Alarm Set!");
				app.sliderUpdate("S".concat(0))
				app.sliderUpdate("V".concat(0))
				j=0;
				t=setTimeout(app.alarmFunction,alarmTime-new Date()-10*60*1000);
				console.log('time out')
				console.log(alarmTime-new Date()-10*60*1000)
				console.log('alarm set to:')
				console.log(alarmTime)
				console.log('current time:')
				console.log(new Date())
			 }
			 else {
				$('#setDate').html("The past? Really!!");
			 }
		 }
		 else {
			$('#setDate').html("Alarm unSet");
			alarmSet=false;
			clearTimeout(t);
			j=0;
			}
		 console.log(alarmSet);
		 console.log('time remaining')
		 console.log((alarmTime-new Date()-10*60*1000 )/1000/60)
		 
		 });

	

	$(document).on('change','#time',function(){
		timeVar=this.value
		console.log('time')
		console.log(this.value)
	})
	
	$(document).on('change','#date',function(){
		dateVar=this.value
		console.log('date')
		console.log(this.value)
	})	
	
	console.log('2')

	
})

class dutyCycle {
  constructor(sections,cycle) { 
  this.sections=sections
  this.cycle=cycle
  this.sectionSize=1000/sections
  this.onCycle=Math.trunc(this.sectionSize*cycle*.01)
  console.log(this.crntTime())
  
  }
  onDuty() {
	if (this.crntTime() % this.sectionSize > this.cycle*.001){
		return 0

	}
	else {
		return 1
	}
  }

  crntTime(){
	
	var d = new Date();
	var n = d.getTime();
	var time=n%1000
	

	return time,1
  }

}
let sendCheck = new dutyCycle(100,100);



var app={}

app.PORT = 1337
app.socketId


app.alarmFunction=function(){

	
			console.log('I made it cpt');

		
			app.sliderUpdate("H".concat($('#HSlider').val()));
			app.sliderUpdate("S".concat(100));
			inter=setInterval(function(){ 
			
				
				if (j==100 || alarmSet==false){

					$('#setDate').html("Alarm unSet");
					alarmSet=false;
					j=0
					clearInterval(inter);
					clearTimeout(t);
					return 
				}
				console.log('value');
				console.log(j);
				app.sliderUpdate("V".concat(j));
				console.log('time remaining');
				console.log((alarmTime-new Date())/1000/60)	;
				j=j+1;
			}, 10*60*1000/100);
		
			
}



		


app.sliderUpdate=function(value) {
	console.log(value)
	app.sendString(value)
}

app.connect = function() {

	var IPAddress = $('#IPAddress').val()

	console.log('Trying to connect to ' + IPAddress)

	$('#startView').hide()
	$('#connectingStatus').text('Connecting to ' + IPAddress)
	$('#connectingView').show()

	chrome.sockets.tcp.create(function(createInfo) {

		app.socketId = createInfo.socketId

		chrome.sockets.tcp.connect(
			app.socketId,
			IPAddress,
			app.PORT,
			connectedCallback)
	})

	function connectedCallback(result) {
	
		if (result === 0) {

			 console.log('Connected to ' + IPAddress)
					 
			 $('#connectingView').hide()
			 $('#controlView').show()
			
		}
		else {

			var errorMessage = 'Failed to connect to ' + app.IPAdress
			console.log(errorMessage)
			navigator.notification.alert(errorMessage, function() {})
			$('#connectingView').hide()
			$('#startView').show()
		}
	}
}

app.sendString = function(sendString) {

	console.log('Trying to send:' + sendString)	
	sendString=sendString.concat(',')
	let bufferTest = new Uint8Array(app.stringToBuffer(sendString))

	for (let i = 0; i < bufferTest.length; i++) {
  		console.log('Entry ' + i + ': ' + bufferTest[i]);
		}
	chrome.sockets.tcp.send (
		app.socketId,
		app.stringToBuffer(sendString),
		function(sendInfo) {

			if (sendInfo.resultCode < 0) {

				var errorMessage = 'Failed to send data'

				console.log(errorMessage)
				navigator.notification.alert(errorMessage, function() {})
			}
		}
	)
}

app.ledOn = function() {

	app.sendString('H')

	$('#led').removeClass('ledOff').addClass('ledOn')

	$('#led').unbind('click').click(function(){
		app.ledOff()
	})	
}

app.ledOff = function() {

	app.sendString('L')
	hyper.log('L')

	$('#led').removeClass('ledOn').addClass('ledOff')

	$('#led').unbind('click').click(function(){
		app.ledOn()
	})
}



app.disconnect = function() {

	chrome.sockets.tcp.close(app.socketId, function() {
		console.log('TCP Socket close finished.')
	})

	$('#controlView').hide()
	$('#startView').show()
}

// Helper functions. 

app.stringToBuffer = function(string) {

	var buffer = new ArrayBuffer(string.length)
	var bufferView = new Uint8Array(buffer)
	
	for (var i = 0; i < string.length; ++i) {

		bufferView[i] = string.charCodeAt(i)
		
	}

	return buffer
}

app.bufferToString = function(buffer) {

	return String.fromCharCode.apply(null, new Uint8Array(buffer))
}

