var casper = require('casper').create(),
    fs = require('fs'),
    entryUrl = 'https://goes-app.cbp.dhs.gov/main/goes/', 
    preActionUrl = 'https://goes-app.cbp.dhs.gov/main/goes/HomePagePreAction.do',
    postActionUrl = 'https://goes-app.cbp.dhs.gov/main/goes/HomePagePostAction.do',
    currentScheduleUrl = 'https://goes-app.cbp.dhs.gov/main/goes/CurrentSchedulePostAction.do',
    calendarUrl = 'https://goes-app.cbp.dhs.gov/main/goes/faces/internetScheduleCalendar.jsf',
    formSelector = 'form[action$="j_security_check"]',
    enterLinkSelector = 'a[href$="HomePagePreAction.do"]',
    manageApptSelector = 'input[name="manageAptm"]',
    rescheduleSelector = 'input[name="reschedule"]',
    locationFormSelector = 'form[name="ApplicationActionForm"]',
    availableDaySelector = 'a[onmouseup^="fireEntrySelected"]',
    day,
    month,
    year,
    time,
    config = {},
    verbose = false;

if ('-v' in casper.cli.args || casper.cli.args == '-v') {
   verbose = true;
}
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

var timeout = function() {
   casper.echo('TIMEOUT');
   casper.capture('timeout.png');
   casper.exit(69);
}

var debug = function(msg) {
   if (verbose) {
      casper.echo(msg);
   }
}

casper.reportErrors = function(f) {
   var ret = null;
   try {
      ret = f.call(this);
   } catch (e) {
      this.capture('error.png');
      debug("ERROR: " + e);
      this.exit();
   }
   return ret;
}

// Log in
console.log('starting');
casper.start(entryUrl, function() {});
// Read and parse the config file
console.log('started');
//console.log('config file: ' + path.resolve(__dirname, 'config.json'));
configFile = fs.read('./config.json');
casper.then(function() {
   this.reportErrors(function() {
      config = JSON.parse(configFile);
   });
})
.then(function() {
   this.reportErrors(function() {
      debug('filling form');
      this.fill(formSelector, {
         'j_username': config.username,
         'j_password': config.password 
      }, true);
   });
})
.waitForSelector(enterLinkSelector, function() {
   this.reportErrors(function() {
   debug('enter link appeared');
   this.click(enterLinkSelector);
   debug('just clicked the enter link');
   });
}, timeout)
.waitForSelector(manageApptSelector, function() {
   this.reportErrors(function() {
   debug('new navigation finished');
   this.click(manageApptSelector);
   });
}, timeout)
.waitForSelector(rescheduleSelector, function() {
   debug('on reschedule page');
   this.click(rescheduleSelector);
}, timeout)
.waitForSelector(locationFormSelector, function() {
   debug('filling enrollment center form');
   this.fill('form[name="ApplicationActionForm"]', {
      //'selectedEnrollmentCenter': '5446'
      'selectedEnrollmentCenter': 'San Francisco Global Entry Enrollment Center - San Francisco International Airport, San Francisco, CA 94128, US'
   }, true);
}, timeout)
.then(function() {
   var header = this.evaluate(function() {
      return document.getElementsByClassName('SectionHeader')[0].innerHTML;
   });
   if (header == 'Appointments are Fully Booked') {
      this.echo('The selected enrollment center is fully booked. Aborting');
      this.exit(69);
   } else {
      debug('getting earliest appointment');
      var monthYear = this.evaluate(function() {
         return document.getElementsByClassName('yearMonthHeader')[0].children[1].innerHTML;
      }).split(' ');
      day = this.evaluate(function() {
         return document.getElementsByClassName('currentDayCell')[0].children[0].children[0].innerHTML;
      });
      month = monthYear[0];
      year = monthYear[1];
   }
})
.then(function() {
   time = this.getElementInfo(availableDaySelector)['text'];
   debug('next appointment: ' + month + ' ' + day + ', ' + year + ' at ' + time);
   this.click(availableDaySelector);
})
.waitForSelector('form[name="ConfirmationForm"]', function() {
   this.reportErrors(function() {
      debug('request submitted');
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
         debug('not scheduling for tomorrow evening');
         this.exit();
      }
      if (newDateStr == ' Jun 30, 2016' && newHour > 16) {
         debug('not scheduling over dodgeball');
         this.exit();
      }
      if (month == 'July' && day <= 5) {
         if (day == 1 && newHour > 16) {
            debug('scheduling for friday before 4 pm');
         } else {
            debug('not scheduling over the long weekend.');
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
