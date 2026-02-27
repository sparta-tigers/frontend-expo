import React, { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';

/**
 * 결합된 Provider 컴포넌트
 * 
 * 여러 Provider를 하나로 묶어 컴포넌트 트리 깊이를 최소화
 * 앙드레 카파시의 '최소한의 코드' 철학 적용
 */
export function CombinedProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </AuthProvider>
  );
}
