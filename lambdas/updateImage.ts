/* eslint-disable import/extensions, import/no-absolute-path */
import { SNSHandler } from "aws-lambda";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const dynamodbclient = new DynamoDBClient({ region: process.env.REGION })

export const handler: SNSHandler = async (event) => {
    console.log("Event ", JSON.stringify(event));

    for (const record of event.Records) {
        const snsMessage = JSON.parse(record.Sns.Message);
        const snsMessageAttribute = JSON.parse(record.Sns.MessageAttributes.metadata_type.Type);

        if (snsMessage) {
            try {
                console.log("test", snsMessage, snsMessageAttribute)
                    
                let updateExpression = ""
                let expressionAttrValue = {}
    
                if (snsMessageAttribute == "Caption") {
                    updateExpression = "SET caption = :caption"
                    expressionAttrValue = {":caption": snsMessage.value}
                } else if (snsMessageAttribute == "Date") {
                    updateExpression = "SET date = :date"
                    expressionAttrValue = {":date": snsMessage.value}
                } else if (snsMessageAttribute == "Photographer") {
                    updateExpression = "SET photographer = :photographer"
                    expressionAttrValue = {":photographer": snsMessage.value}
                }
    
                const commandOutput = new UpdateCommand({
                    TableName: process.env.TABLE_NAME,
                    Key: {
                        id: snsMessage.id,
                    },
                    UpdateExpression: updateExpression,
                    ExpressionAttributeValues: expressionAttrValue,
                    ReturnValues: "UPDATED_NEW",
                })
                
                await dynamodbclient.send(commandOutput);
                
    
                console.log("Updated image: ", JSON.stringify(commandOutput));
    
            } catch (error) {
                console.error("Error updating image: ", error);
            }
        }
        
    }

};
