

export const Middleware = async (req, res, next) => {
  try {
    // Get the token from the request body or headers or wherever it's passed
    const token = req.body.token || req.headers.authorization || "";
 

    if (!token) {
      return res.status(401).json({ error: "Akses ditolak silahkan login terlebih dahulu" });
    }

    // Find the user associated with the provided token
  

    next(); // Continue to the next middleware or route handler
  } catch (error) {
    console.error("Middleware Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
