import { EC2Client, StartInstancesCommand } from '@aws-sdk/client-ec2'

const ec2 = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' })

export const handler = async (event) => {
  console.log('Wake-up request received', JSON.stringify(event))

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle preflight OPTIONS request
  if (
    event.requestContext &&
    event.requestContext.http &&
    event.requestContext.http.method === 'OPTIONS'
  ) {
    return {
      statusCode: 204,
      headers,
      body: '',
    }
  }

  const instanceId = process.env.EC2_INSTANCE_ID
  if (!instanceId) {
    console.error('EC2_INSTANCE_ID environment variable is not configured.')
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error:
          'EC2_INSTANCE_ID environment variable is not configured on Lambda.',
      }),
    }
  }

  try {
    console.log(`Starting EC2 Instance: ${instanceId}`)
    const command = new StartInstancesCommand({ InstanceIds: [instanceId] })
    const response = await ec2.send(command)
    console.log('StartInstances response:', JSON.stringify(response))

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Wake-up signal sent successfully.',
        currentState: response.StartingInstances[0].CurrentState.Name,
        previousState: response.StartingInstances[0].PreviousState.Name,
      }),
    }
  } catch (error) {
    console.error('Error starting EC2 instance:', error)
    const errMsg = error instanceof Error ? error.message : String(error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to start EC2 instance.',
        details: errMsg,
      }),
    }
  }
}
