import { useEffect, useState } from "react";
import { companyService } from "../api/services";
import type { Company } from "../types/domain";

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    companyService
      .list()
      .then(setCompanies)
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, []);

  return { companies, setCompanies, loading };
}
