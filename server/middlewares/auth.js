export const authorizer = (req, res, next) => {
  const deny = () => {
    res.set("WWW-Authenticate", 'Basic realm="Restricted"');
    res.status(401).send("Authentication required.");
  };

  const authHeader = req.headers.authorization || "";
  const b64auth = authHeader.split(" ")[1];

  if (!b64auth) return deny();

  try {
    const credentials = Buffer.from(b64auth, "base64").toString("utf8");

    const idx = credentials.indexOf(":");
    if (idx < 0) return deny();

    const login = credentials.slice(0, idx);
    const password = credentials.slice(idx + 1);

    if (
      login !== process.env.AUTH_USER ||
      password !== process.env.AUTH_PASS
    ) {
      return deny();
    }

    return next();
  } catch (err) {
    console.error("Basic Auth error:", err);
    return deny();
  }
};
