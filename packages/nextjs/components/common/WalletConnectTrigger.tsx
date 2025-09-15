import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useContracts } from "~~/providers/ContractsContext";

const WalletConnectTrigger = () => {
  const { signLoginMessage } = useContracts();
  const navigate = useNavigate();
  const triggered = useRef(false);
  const notify = useNotify();

  useEffect(() => {
    async function init() {
      if (triggered.current) {
        return;
      }
      triggered.current = true;
      try {
        const code = await signLoginMessage();
        navigate(`/eip712_login?code=${code}`);
      } catch (e) {
        notify(`${window["XOConnect"]} - ${e.body.message}`, {
          type: "error",
          autoHideDuration: 10000,
        });
      }
    }
    init();
  }, []);

  return <button>Connect Bexxo</button>;
};
