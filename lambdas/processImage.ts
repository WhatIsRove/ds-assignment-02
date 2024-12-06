/* eslint-disable import/extensions, import/no-absolute-path */
import { SQSHandler } from "aws-lambda";
import {
  GetObjectCommand,
  GetObjectCommandInput,
  S3Client
} from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { PartitionKey } from "aws-cdk-lib/aws-appsync";

const s3 = new S3Client();
const dynamodbclient = new DynamoDBClient({region: process.env.REGION})

export const handler: SQSHandler = async (event) => {
  console.log("Event ", JSON.stringify(event));
  for (const record of event.Records) {
    const recordBody = JSON.parse(record.body);        // Parse SQS message
    const snsMessage = JSON.parse(recordBody.Message); // Parse SNS message

    if (snsMessage.Records) {
      console.log("Record body ", JSON.stringify(snsMessage));
      for (const messageRecord of snsMessage.Records) {
        const s3e = messageRecord.s3;
        const srcBucket = s3e.bucket.name;
        // Object key may have spaces or unicode non-ASCII characters.
        const srcKey = decodeURIComponent(s3e.object.key.replace(/\+/g, " "));
        let origimage = null;
        try {
          // Download the image from the S3 source bucket.
          const params: GetObjectCommandInput = {
            Bucket: srcBucket,
            Key: srcKey,
          };

          if (!params.Key?.includes(".jpeg") && !params.Key?.includes(".png")) {
            console.log("Error, wrong file type.")
            throw new Error("Wrong file type.");
          }
          origimage = await s3.send(new GetObjectCommand(params));

          const commandOutput = await dynamodbclient.send(
            new PutCommand({
              TableName: process.env.TABLE_NAME,
              Item: {
                id: srcKey,
                bucketName: srcBucket,
              }
            })
          )
          console.log("Added image to images table: ", JSON.stringify(commandOutput))
        } catch (error) {
          console.log(error);
          throw new Error(JSON.stringify(error));
        }
      }
    }
  }
};