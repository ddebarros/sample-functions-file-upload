const AWS = require('aws-sdk');
const SPACES_ENDPOINT = process.env['SPACES_ENDPOINT']; 
const SPACES_NAME = process.env['SPACES_NAME'];
const SPACES_KEY = process.env['SPACES_KEY']
const SPACES_SECRET = process.env['SPACES_SECRET']

const s3 = new AWS.S3({
  endpoint: SPACES_ENDPOINT,
  accessKeyId: SPACES_KEY,
  secretAccessKey: SPACES_SECRET
})

async function main(args) {
  console.log(process.env)
  if (args.__ow_method == "options") {
    return {
      headers: {
        'Access-Control-Allow-Methods': 'OPTIONS, POST',
        'Access-Control-Allow-Origin': '*'
      },
      statusCode: 200
    }
  }
  
  const fileName = args.file_name;
  const contentType = args.content_type;

  if (!fileName || !contentType) {
    console.log('missing file_name or content_type')
    return {
      statusCode: 400,
      body: {
        message: 'missing file_name or content_type',
      }
    }
  }

  const params = {
    Bucket: SPACES_NAME,
    Fields: {
      'Content-Type': contentType,
      key: fileName,
    },
    Expires: 300,
    Conditions: [
      { 'acl': 'public-read' }
    ]
  };

  try {
    const signedPayload = await new Promise((resolve, reject) => {
      s3.createPresignedPost(params, (err, data) => {
        if (err) {
          reject(err);
          console.error(data)
          return;
        }
        resolve(data);
      })
    })
    console.log(`Successfully signed payload for ${signedPayload.url}/${signedPayload.fields.key}`)

    return {
      statusCode: 200,
      body: {
        payload: signedPayload,
      }
    }
  } catch (error) {
    return {
      statusCode: 400,
      body: {
        message: `unable to get signed url: ${error.message}`,
      }
    }
  }
}

exports.main = main;

