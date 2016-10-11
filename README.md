## NOTE

This will only reschedule an existing appointment. If you have not manually scheduled an appointment yet, this will break.

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
