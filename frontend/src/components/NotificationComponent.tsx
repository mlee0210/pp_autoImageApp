// src/components/NotificationComponent.tsx
import React, { useEffect, useState } from 'react';

type NotificationComponentProps = {
  message: string;
};

const NotificationComponent: React.FC<NotificationComponentProps> = ({ message }) => {
  return (
    <div className="notification">
      <p>{message}</p>
    </div>
  );
};

export default NotificationComponent;
