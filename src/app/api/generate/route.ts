import { NextResponse } from 'next/server'
import Replicate from 'replicate'

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error('REPLICATE_API_TOKEN is not set')
}

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
})

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    console.log('Generating emoji with prompt:', prompt)
    
    const prediction = await replicate.predictions.create({
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      input: {
        prompt: `A cute emoji of ${prompt}, simple flat design, minimalist style, vibrant colors, centered composition, white background`,
        negative_prompt: "text, watermark, signature, blurry, low quality, username, realistic, 3d, photorealistic, human, face",
        width: 512,
        height: 512,
        num_outputs: 1,
        num_inference_steps: 50,
        guidance_scale: 7.5,
        scheduler: "K_EULER"
      }
    })

    console.log('Started prediction:', prediction)

    // Wait for the prediction to complete
    let completed = await replicate.predictions.get(prediction.id)
    while (completed.status !== 'succeeded' && completed.status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000))
      completed = await replicate.predictions.get(prediction.id)
      console.log('Prediction status:', completed.status)
    }

    console.log('Completed prediction:', completed)

    if (completed.status === 'failed') {
      const errorMessage = String(completed.error || 'Prediction failed')
      throw new Error(errorMessage)
    }

    if (!completed.output || !Array.isArray(completed.output) || !completed.output[0]) {
      throw new Error('No output received from Replicate')
    }

    return NextResponse.json({ imageUrl: completed.output[0] })
  } catch (error: unknown) {
    console.error('Error generating emoji:', error)
    
    interface ReplicateError {
      response: {
        status: number;
      };
    }

    interface NetworkError {
      code: string;
    }

    function isReplicateError(err: unknown): err is ReplicateError {
      return (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response: unknown }).response === 'object' &&
        (err as { response: unknown }).response !== null &&
        'status' in (err as { response: { status?: unknown } }).response &&
        typeof (err as { response: { status: unknown } }).response.status === 'number'
      );
    }

    function isNetworkError(err: unknown): err is NetworkError {
      return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        typeof (err as { code: unknown }).code === 'string'
      );
    }
    
    if (isReplicateError(error) && error.response.status === 402) {
      return NextResponse.json(
        { error: 'Please wait a few minutes after setting up billing before trying again.' },
        { status: 402 }
      )
    }

    if (isNetworkError(error) && ['ECONNREFUSED', 'ECONNRESET'].includes(error.code)) {
      return NextResponse.json(
        { error: 'Failed to connect to Replicate API. Please try again.' },
        { status: 503 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Failed to generate emoji'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
} 