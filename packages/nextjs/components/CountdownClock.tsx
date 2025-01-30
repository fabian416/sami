import React, { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { isMobile } from "react-device-detect";

// Transformar milisegundos a minutos y segundos
// const transformMilisecondsIntoClockTime = (miliseconds: number) => {
//   const minutes = Math.floor(miliseconds / (1000 * 60)); // Milisegundos a minutos
//   const seconds = Math.floor((miliseconds % (1000 * 60)) / 1000); // Resto a segundos
//   return { minutes, seconds };
// };

// const CountdownClock = ({ clockTimer, setClockTimer }: any) => {
const CountdownClock = ({ clockTimer }: any) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const endTimeRef = useRef<number | null>(null);

  // Actualizar el tiempo final cuando se recibe `timeBeforeEnds` y `serverTime`
  useEffect(() => {
    if (!clockTimer?.timeBeforeEnds || !clockTimer?.serverTime) return;

    const clientTime = Date.now(); // Hora actual del cliente
    const timeOffset = clockTimer.serverTime - clientTime; // Diferencia entre cliente y servidor

    const endTime = clientTime + timeOffset + clockTimer.timeBeforeEnds; // Tiempo final ajustado
    endTimeRef.current = endTime;

    const diff = Math.max(0, Math.floor((endTime - clientTime) / 1000)); // Tiempo restante inicial
    setTimeLeft(diff);
  }, [clockTimer?.timeBeforeEnds, clockTimer?.serverTime]);

  // Actualizar el tiempo restante cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      if (endTimeRef.current) {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((endTimeRef.current - now) / 1000)); // Diferencia en segundos
        setTimeLeft(diff);

        if (diff <= 0) {
          clearInterval(timer); // Detenemos el temporizador cuando llega a 0
        }
      }
    }, 500);

    return () => clearInterval(timer); // Limpiar el intervalo al desmontar
  }, [timeLeft]);

  // Formatear el tiempo restante como minutos y segundos
  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Si el tiempo es 0, no mostrar el temporizador
  if (timeLeft === 0) return null;

  return (
    <div
      className={`fixed top-0 ${
        isMobile ? "left-20" : "left-1/2"
      } mt-1 transform -translate-x-1/2 flex justify-center items-center rounded-md p-2 w-12 z-[1000]`}
    >
      <span
        className={`text-lg font-mono ${isDarkMode ? "text-green-500" : "text-green-700"}`}
        style={{
          textShadow: "0 0 5px #00FF00", // Tailwind no tiene soporte directo para text-shadow
        }}
      >
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default CountdownClock;
