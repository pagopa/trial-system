#!/bin/bash

echo "Logging to Azure..."
az login

CURRENTDATE=`date +"%Y-%m-%d"`
Color_Off='\033[0m'       # Text Reset
Yellow='\033[0;33m'       # Yellow
BYellow='\033[1;33m'      # Yellow
Red='\033[0;31m'          # Red

read -p "Do you want to load a local csv file (y/n) [Default: y]? > " LOAD_FROM_LOCAL_DRIVE
LOAD_FROM_LOCAL_DRIVE=${LOAD_FROM_LOCAL_DRIVE:-y}

if [ "$LOAD_FROM_LOCAL_DRIVE" = "y" ] ; 
then
    read -p "Please enter a local file path: > " FILE_TO_SPLIT
else
    echo -e "${Yellow}Remote csv files must be located into ${BYellow}iopstexportdata ${Yellow}storage account${Color_Off}"
    FILE_EXISTS=false
    while [ "$FILE_EXISTS" = false ];
    do
        read -p "Please enter a valid remote blob file path (including container i.e: input/trial-system/file.csv): > " REMOTE_FILE_PATH

        REMOTE_CONTAINER_NAME="$(dirname "${REMOTE_FILE_PATH}")"
        REMOTE_BLOB_NAME="$(basename "${REMOTE_FILE_PATH}")"
        FILE_EXISTS=$(az storage blob exists --account-name iopstexportdata --container-name "$REMOTE_CONTAINER_NAME" --name "$REMOTE_BLOB_NAME" --query exists --output json)
        
        if [ "$FILE_EXISTS" = false ] ;
        then
            echo -e "${Red}====================================================${Color_Off}"
            echo -e "${Red}The specified remote blob file path does not exists!${Color_Off}"
            echo -e "${Red}====================================================${Color_Off}"
        fi
    done

    echo "Downloading remote blob..."
    FILE_TO_SPLIT="/tmp/$REMOTE_BLOB_NAME"

    az storage blob download -f "$FILE_TO_SPLIT" --account-name iopstexportdata -c "$REMOTE_CONTAINER_NAME" -n "$REMOTE_BLOB_NAME" --no-progress
fi
NUMBER_OF_LINES=$(wc -l < $FILE_TO_SPLIT | xargs)
((NUMBER_OF_LINES++))

echo -e "${Yellow}Please note that you have selected a file that contains ${BYellow}$NUMBER_OF_LINES user/s${Color_Off}"

read -p "How many users per chunk do you want to process [Default: $NUMBER_OF_LINES]? > " LINES_PER_CHUNK
LINES_PER_CHUNK=${LINES_PER_CHUNK:-$NUMBER_OF_LINES}

read -p "What's the Logic App url to be invoked? (see: https://portal.azure.com/#view/Microsoft_Azure_EMA/WorkflowMenuBlade/~/workflowOverview/resourceId/%2Fsubscriptions%2Fec285037-c673-4f58-b594-d7c480da4e8b%2FresourceGroups%2Fio-p-rg-operations%2Fproviders%2FMicrosoft.Web%2Fsites%2Fio-p-lapp-common%2Fworkflows%2Factivate-trial-users/location/West%20Europe/isReadOnly~/false) > " LAPP_URL

read -p "What's the trial identifier? > " TRIAL_ID

read -p "Please enter the api key to be used through the Trial System APIs: > " API_KEY

read -p "Please enter the delay you want to apply between activations (in milliseconds) [Default: 0]: > " DELAY
DELAY=${DELAY:-0}

read -p "Do you want to enable message notification flow for each activation (y/n) [Default: n]? > " ENABLE_MESSAGE_FLOW_STR
ENABLE_MESSAGE_FLOW_STR=${ENABLE_MESSAGE_FLOW_STR:-n}

case "$ENABLE_MESSAGE_FLOW_STR" in
 Y) ENABLE_MESSAGE_FLOW=true ;;
 N) ENABLE_MESSAGE_FLOW=false ;;
esac

if [ "$ENABLE_MESSAGE_FLOW" = true ] ; 
then
    read -p "What's the flow name you want to use as identifier (1 word, max 20 chars)[Default: $CURRENTDATE]? > " FLOW_NAME
    FLOW_NAME=${FLOW_NAME:-$CURRENTDATE}
    read -p "Please enter the api key used to send messages: > " MESSAGE_API_KEY
    read -p "Please enter the message template name to be used [listed on: https://github.com/pagopa/io-bulk-message/tree/main/templates]: > " MESSAGE_TEMPLATE_NAME
fi

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
