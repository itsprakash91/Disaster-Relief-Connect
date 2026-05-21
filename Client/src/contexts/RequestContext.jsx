import React, { createContext, useState } from "react";

export const RequestsContext = createContext();

export const RequestsProvider = ({ children }) => {
  const [requests, setRequests] = useState([]);

  return (
    <RequestsContext.Provider value={{ requests, setRequests }}>
      {children}
    </RequestsContext.Provider>
  );
};
