## NOTE

This will only reschedule an existing appointment. If you have not manually scheduled an appointment yet, this will break.

By default, this is hardcoded to use the SFO location. To change this, you need to update the `selectedEnrollmentCenter` field in the payload for `this.fill('form[name="ApplicationActionForm"])`. You will need to use the exact contents of the select element for the location you need. Use Inspect Element to get this.

## PREREQUISITES

* Installed homebrew
* Installed node via homebrew
* Installed casper via `npm install -g casperjs`

## TO USE:

* Clone this to your homedir:
  * `git clone https://github.com/cbrenton/fuck_global_entry.git ~/globalentry`
* Update the credentials in config.json
* Update the email variable in fuck_global_entry.sh
* Run `./start_cron.sh`

## TO TURN OFF:

* Run `./stop_cron.sh`

## TO DEBUG:

`tail -f ~/globalentry.log`
