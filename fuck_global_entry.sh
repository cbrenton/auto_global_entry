# CHANGE ME
email="foo@bar.com"

export PATH=/usr/local/bin:$PATH
date=`date +"%T"`
#echo "---\n$date" >> ~/globalentry.log
result=$(casperjs `dirname "$0"`/fuck_global_entry.js)
if [ $? -eq 69 ]; then
   mail -s "Global entry interview rescheduled" $email <<< $result
fi
echo "$date: $result" >> ~/globalentry.log
