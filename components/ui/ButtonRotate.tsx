import { cn } from "../../lib/utils";
import { Button } from "./Button";

interface ButtonRotateProps {
    text?: string;
    onClick?: () => void;
    className?: string;
}

export const ButtonRotate = ({
    text = "EXPLORE SENTINEL AI",
    onClick,
    className
}: ButtonRotateProps) => {
    return (
        <div className={cn("border p-1 rounded-full border-dotted border-purple-500/50", className)}>
            <Button
                onClick={onClick}
                className="group relative w-[100px] h-[100px] rounded-full overflow-hidden p-0 grid place-content-center bg-purple-600 hover:bg-purple-500 transition-colors"
            >
                <p
                    className="absolute inset-0 animate-spin-slow"
                    style={{
                        animationDuration: "8s",
                    }}
                >
                    {Array.from(text).map((char, i) => (
                        <span
                            key={i}
                            className="absolute text-[10px] font-bold text-white tracking-wider"
                            style={{
                                inset: "6px",
                                transform: `rotate(${(360 / text.length) * i}deg)`,
                                transformOrigin: "50% 50%",
                                userSelect: "none",
                                display: "inline-block",
                            }}
                        >
                            {char === " " ? "\u00A0" : char}
                        </span>
                    ))}
                </p>

                <div className="relative w-[40px] h-[40px] rounded-full text-purple-600 bg-white flex items-center justify-center overflow-hidden">
                    {/* First arrow - moves out on hover */}
                    <svg
                        viewBox="0 0 14 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute w-4 h-4 transition-transform duration-300 ease-in-out group-hover:translate-x-[150%] group-hover:-translate-y-[150%]"
                    >
                        <path
                            d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                            fill="currentColor"
                        />
                    </svg>
                    {/* Second arrow - moves in on hover */}
                    <svg
                        viewBox="0 0 14 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="absolute w-4 h-4 transition-transform duration-300 ease-in-out delay-100 -translate-x-[150%] translate-y-[150%] group-hover:translate-x-0 group-hover:translate-y-0"
                    >
                        <path
                            d="M13.376 11.552l-.264-10.44-10.44-.24.024 2.28 6.96-.048L.2 12.56l1.488 1.488 9.432-9.432-.048 6.912 2.304.024z"
                            fill="currentColor"
                        />
                    </svg>
                </div>
            </Button>

            <style>{`
        @keyframes spin-slow {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
        </div>
    );
};

export default ButtonRotate;
