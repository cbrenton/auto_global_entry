var casper = require('casper').create(),
    fs = require('fs'),
    path = require('path'),
    entryUrl = 'https://goes-app.cbp.dhs.gov/main/goes/', 
    preActionUrl = 'https://goes-app.cbp.dhs.gov/main/goes/HomePagePreAction.do',
    postActionUrl = 'https://goes-app.cbp.dhs.gov/main/goes/HomePagePostAction.do',
    currentScheduleUrl = 'https://goes-app.cbp.dhs.gov/main/goes/CurrentSchedulePostAction.do',
    calendarUrl = 'https://goes-app.cbp.dhs.gov/main/goes/faces/internetScheduleCalendar.jsf',
    formSelector = 'form[action$="/pkmslogin.form"]',
    enterLinkSelector = 'a[href$="HomePagePreAction.do"]',
    manageApptSelector = 'input[name="manageAptm"]',
    rescheduleSelector = 'input[name="reschedule"]',
    locationFormSelector = 'form[name="ApplicationActionForm"]',
    availableDaySelector = 'a[onmouseup^="fireEntrySelected"]',
    day,
    month,
    year,
    time,
    config = {};

/*
console.log('args:');
require("utils").dump(casper.cli.args);
console.log('options:');
require("utils").dump(casper.cli.options);
*/
/*
var args = require("utils").dump(casper.cli.args),
    username = args[0],
    password = args[1];
*/


casper.reportErrors = function(f) {
   var ret = null;
   try {
      ret = f.call(this);
   } catch (e) {
      this.capture('error.png');
      this.echo("ERROR: " + e);
      this.exit();
   }
   return ret;
}


// Log in
casper.start(entryUrl, function() {});
// Read and parse the config file
configFile = fs.read(path.resolve(__dirname, 'config.json');
casper.then(function() {
   this.reportErrors(function() {
      config = JSON.parse(configFile);
   });
})
.then(function() {
   this.reportErrors(function() {
      //this.echo('filling form');
      this.fill(formSelector, {
         'username': config.username,
         'password': config.password 
      }, true);
   });
})
.waitForSelector(enterLinkSelector, function() {
   this.click(enterLinkSelector);
   //this.echo('just clicked the enter link');
})
//.waitForUrl(preActionUrl, function() {
.waitForSelector(manageApptSelector, function() {
   //this.echo('new navigation finished');
   this.click(manageApptSelector);
})
.waitForSelector(rescheduleSelector, function() {
   //this.echo('on reschedule page');
   this.click(rescheduleSelector);
})
.waitForSelector(locationFormSelector, function() {
   this.fill('form[name="ApplicationActionForm"]', {
      //'selectedEnrollmentCenter': '5446'
      'selectedEnrollmentCenter': 'San Francisco Global Entry Enrollment Center - San Francisco International Airport, San Francisco, CA 94128, US'
   }, true);
})
.then(function() {
   this.getElementAttribute('.yearMonthHeader')
   var monthYear = this.evaluate(function() {
      return document.getElementsByClassName('yearMonthHeader')[0].children[1].innerHTML;
   }).split(' ');
   day = this.evaluate(function() {
      return document.getElementsByClassName('currentDayCell')[0].children[0].children[0].innerHTML;
   });
   month = monthYear[0];
   year = monthYear[1];
})
.then(function() {
   time = this.getElementInfo(availableDaySelector)['text'];
   //this.echo('next appointment: ' + month + ' ' + day + ', ' + year + ' at ' + time);
   this.click(availableDaySelector);
})
.waitForSelector('form[name="ConfirmationForm"]', function() {
   this.reportErrors(function() {
      //this.echo('request submitted');
      var confirmationText = this.getElementInfo('.maincontainer')['text'];
      var lines = confirmationText.match(/[^\r\n]+/g);
      var origDateStr,
         newDateStr,
         origTime,
         origHour,
         newTime,
         newHour;
      for (var i = 0; i < lines.length; i++) {
         line = lines[i].trim();
         if (line.match(/^Original Interview Date/)) {
            origDateStr = lines[i].split(':')[1];
         }
         if (line.match(/^Original Interview Time/)) {
            origTime = lines[i].split(':')[1];
            origHour = origTime.split(':')[0];
         }
         if (line.match(/^New Interview Date/)) {
            newDateStr = lines[i].split(':')[1];
         }
         if (line.match(/^New Interview Time/)) {
            newTime = lines[i].split(':')[1];
            newHour = newTime.split(':')[0];
         }
      }
      // Add date conflict logic here
      /*
      if (newDateStr == ' Jun 29, 2016' && newHour > 17) {
         this.echo('not scheduling for tomorrow evening');
         this.exit();
      }
      if (newDateStr == ' Jun 30, 2016' && newHour > 16) {
         this.echo('not scheduling over dodgeball');
         this.exit();
      }
      if (month == 'July' && day <= 5) {
         if (day == 1 && newHour > 16) {
            this.echo('scheduling for friday before 4 pm');
         } else {
            this.echo('not scheduling over the long weekend.');
            this.exit();
         }
      }
      */
      if (Date.parse(origDateStr) < Date.parse(newDateStr)) {
         this.echo('You already have the earliest available appointment.')
         this.exit();
      }
      if (Date.parse(origDateStr) == Date.parse(newDateStr)) {
         if (newHour >= origHour) {
            this.echo('A later appointment is available on the same date.');
            this.exit();
         }
      }
      this.fill('form[name="ConfirmationForm"]', {
         'comments': 'earlier appointment'
      });
      this.click('input[name="Confirm"]');
   });
})
.waitForSelector(rescheduleSelector, function() {
   this.echo('rescheduled your appointment for ' + month + ' ' + day + ', ' + year + ' at ' + time);
   this.capture('screen.png');
   this.exit(69);
});

casper.run();
