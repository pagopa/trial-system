#!/bin/bash
FILE_TO_SPLIT=$1
CURRENTDATE=`date +"%Y-%m-%d"`

read -p "How many lines(users) per chunk do you need to process? > " LINES_PER_CHUNK

read -p "What's the Logic App url to be invoked? > " LAPP_URL

read -p "What's the trial identifier? > " TRIAL_ID

read -p "Please enter the api key to be used through the Trial System APIs: > " API_KEY

read -p "Do you want to apply a delay between activations [Default: 0 ms]? > " DELAY
DELAY=${DELAY:-0}

read -p "Do you want to enable message notification flow for each activation [Default: false]? > " ENABLE_MESSAGE_FLOW
ENABLE_MESSAGE_FLOW=${ENABLE_MESSAGE_FLOW:-false}

if [ "$ENABLE_MESSAGE_FLOW" = true ] ; 
then
    read -p "What's the flow name you want to use as identifier (1 word, max 20 chars)[Default: $CURRENTDATE]? > " FLOW_NAME
    FLOW_NAME=${FLOW_NAME:-$CURRENTDATE}
    read -p "Please enter the api key used to send messages: > " MESSAGE_API_KEY
    read -p "Please enter the message template name to be used [listed on: https://github.com/pagopa/io-bulk-message/tree/main/templates]: > " MESSAGE_TEMPLATE_NAME
fi

echo "Logging to Azure..."
az login

ORIGINAL_FILENAME="$(basename "${FILE_TO_SPLIT}" ".csv")"
ORIGINAL_PATH="$(dirname "${FILE_TO_SPLIT}")"

echo "Splitting input file into chunks of $LINES_PER_CHUNK lines..."
split -l $LINES_PER_CHUNK $FILE_TO_SPLIT "$ORIGINAL_PATH/splitted_$ORIGINAL_FILENAME"

for i in $ORIGINAL_PATH/splitted* ; 
do 
  dirfilename=$i
  filename="$(basename "${dirfilename}")"
  mv "$i" "$i.csv" ;
  az storage blob upload --account-name iopstexportdata --container-name input/trial-system --file "$i.csv" --name "$filename.csv" --overwrite

if [ "$ENABLE_MESSAGE_FLOW" = true ] ;
then
    curl --location "$LAPP_URL" \
    --header 'Content-Type: application/json' \
    --data-raw "{
        \"api_key\": \"$API_KEY\",
        \"trial_id\": \"$TRIAL_ID\",
        \"filename\": \"$filename.csv\",
        \"delay\": $DELAY,
        \"enable_message_flow\": $ENABLE_MESSAGE_FLOW,
        \"flow_name\": \"$FLOW_NAME\",
        \"message_api_key\": \"$MESSAGE_API_KEY\",
        \"message_template_name\": \"$MESSAGE_TEMPLATE_NAME\"

    }"
else
    curl --location "$LAPP_URL" \
    --header 'Content-Type: application/json' \
    --data-raw "{
        \"api_key\": \"$API_KEY\",
        \"trial_id\": \"$TRIAL_ID\",
        \"filename\": \"$filename.csv\",
        \"delay\": $DELAY
    }"
fi
done

echo "Removing splitted file from local drive..."
rm -fr $ORIGINAL_PATH/splitted*
