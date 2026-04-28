const logSocketInfo = (message, meta = {}) => {
  console.log(`[socket] ${message}`, meta);
};

const logSocketError = (message, meta = {}) => {
  console.error(`[socket] ${message}`, meta);
};

export { logSocketInfo, logSocketError };
