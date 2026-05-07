export const isSuperAdmin = (user) => user?.role === "SuperAdmin";

export const getScopedCompanyId = (req) => {
  if (isSuperAdmin(req.user)) return req.params.companyId || req.body.companyId || req.query.companyId;
  return req.user?.companyId?.toString();
};

export const requireCompanyScope = (req, res) => {
  const companyId = getScopedCompanyId(req);
  if (!companyId) {
    res.status(403).json({ message: "Company scope is required" });
    return null;
  }
  return companyId;
};
