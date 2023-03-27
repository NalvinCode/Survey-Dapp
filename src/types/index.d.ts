export {};

declare global {
  interface Window {
    example: any;
    ethereum: any;
  }

  interface Survey{
    title?: string,
    image?: string,
    questions: [{}]
  }
}