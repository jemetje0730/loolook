export {};

declare global {
  interface Window {
    kakao: any;                 // 여기서만 정의
    DeviceOrientationEvent?: any; // 필요하면 같이
  }
}
