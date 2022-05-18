import { createWriteStream } from 'fs'
import { unlink } from 'fs/promises'
import AWS from 'aws-sdk'

function missingVar() {
  const vars = [
    'MY_AWS_ACCESS_KEY_ID',
    'MY_AWS_SECRET_ACCESS_KEY',
    'MY_AWS_BUCKET_NAME',
  ]
  let missingVar = false
  for (const envVar of vars) {
    if (!process.env[envVar]) {
      console.error(`Required environment variable is not present: ${envVar}`)
      missingVar = true
    }
  }
  return missingVar
}

function downloadFromS3(key) {
  console.log(`Downloading ${key} from S3`)
  const s3 = new AWS.S3({
    accessKeyId: process.env.MY_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY,
    region: 'us-east-1',
    apiVersion: '2006-03-01',
  })
  const params = {
    Bucket: process.env.MY_AWS_BUCKET_NAME,
    Key: key,
  }
  let file = createWriteStream(key)
  return new Promise((resolve, reject) => {
    s3.getObject(params)
      .createReadStream()
      .on('end', () => {
        return resolve()
      })
      .on('error', (error) => {
        return reject(error)
      })
      .pipe(file)
  })
}

export const onPreBuild = function ({ utils: { build } }) {
  console.log(process.env.INCOMING_HOOK_BODY)
  if (!process.env.INCOMING_HOOK_BODY) {
    build.cancelBuild('No version payload received')
  }
}

export const onSuccess = async function ({
  constants: { PUBLISH_DIR },
  utils: { run },
}) {
  if (missingVar()) return
  const key = '8ef315a8a10bb6bc3f8541590169b30b9c23d197.tgz'
  await downloadFromS3(key)
  run.command(`mkdir -f ${PUBLISH_DIR}`)
  run.command(`tar --strip-components 1 -vxzf ${key} -C ${PUBLISH_DIR}`)
  await unlink(key)
}
