'use client';

export interface AppSplashScreenProps {
  isGuest?: boolean;
  forceShow?: boolean;
  autoDismiss?: boolean;
}

/**
 * AppSplashScreen - Đã được tối ưu hóa theo kiến trúc Zero-React Splash.
 * Ứng dụng chỉ sử dụng duy nhất 1 màn hình Native Splash của Hệ điều hành (Android/iOS),
 * triệt tiêu hoàn toàn overlay trong React để mang lại tốc độ tức thì và tránh 2 màn hình liên tiếp.
 */
export default function AppSplashScreen(_props: AppSplashScreenProps) {
  return null;
}


