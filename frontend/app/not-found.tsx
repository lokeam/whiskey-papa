'use client';

import { ErrorPageColTemplate } from '@/components/error/ErrorPageOneColTemplate';

export default function NotFound() {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <ErrorPageColTemplate
      title="Something's missing."
      subtext="Sorry, we can't find that page. You'll find lots to explore on the home page."
      buttonText="Back to Home"
      onButtonClick={handleGoHome}
    />
  );
}
