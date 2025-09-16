import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useContracts } from "~~/providers/ContractsContext";

export const WalletConnectTrigger = () => {
  const { forceLogin } = useContracts();
  const triggered = useRef(false);

  useEffect(() => {
    async function init() {
      if (triggered.current) {
        return;
      }
      triggered.current = true;
      try {
        await forceLogin();
      } catch (e: any) {
        const prefix =
          typeof window !== "undefined" && (window as any)["XOConnect"]
            ? String((window as any)["XOConnect"])
            : "XOConnect";

        const msg = e?.body?.message || e?.details?.message || e?.message || "No se pudo conectar la wallet.";

        toast.error(`${prefix} - ${msg}`, { autoClose: 10000 });

        triggered.current = false;
      }
    }
    init();
  }, []);

  return <div>Connect</div>;
};
