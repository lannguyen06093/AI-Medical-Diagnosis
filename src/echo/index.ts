import Echo from '@merit-systems/echo-next-sdk'

// Create server bindings to Echo providers (e.g., OpenAI via Echo)
export const { handlers, openai, anthropic } = Echo({
  appId: process.env.NEXT_PUBLIC_ECHO_APP_ID || 'c44909c1-2bd0-450c-9718-e3dd8736c6c5'
})
