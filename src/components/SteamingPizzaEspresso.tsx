export default function SteamingPizzaEspresso() {
  return (
    <div className="relative flex items-center justify-center gap-8 py-2 select-none">
      {/* 1. Hot Artisanal Neapolitan Pizza Slice with Rising Steam */}
      <div className="relative group">
        {/* Animated Rising Steam Vapors above the Pizza in Warm Vintage Cream #f1e194 */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-24 h-20 pointer-events-none overflow-visible">
          {/* Steam plume 1 */}
          <svg
            className="absolute bottom-0 left-2 w-8 h-16 text-[#f1e194]/45 animate-steam-1"
            viewBox="0 0 28 60"
            fill="none"
          >
            <path
              d="M14 60 C8 48 20 38 12 24 C6 14 18 6 10 0"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Steam plume 2 */}
          <svg
            className="absolute bottom-0 left-8 w-9 h-18 text-white/55 animate-steam-2"
            viewBox="0 0 32 70"
            fill="none"
          >
            <path
              d="M16 70 C24 55 10 42 20 28 C28 16 14 8 22 0"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          {/* Steam plume 3 */}
          <svg
            className="absolute bottom-0 left-14 w-7 h-14 text-[#f1e194]/40 animate-steam-3"
            viewBox="0 0 24 50"
            fill="none"
          >
            <path
              d="M12 50 C6 38 16 30 10 18 C5 10 14 4 8 0"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Pizza Slice SVG */}
        <div className="relative filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
          <svg
            className="w-24 h-24 md:w-28 md:h-28 transition-transform duration-300 group-hover:scale-105"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ambient Shadow */}
            <ellipse cx="50" cy="88" rx="42" ry="7" fill="black" fillOpacity="0.6" />

            {/* Pizza Crust (Wood-Fired Outer Rim in Deep Wine #5B0E14 & Toasted Wood) */}
            <path
              d="M14 26 C36 12 64 12 86 26 C90 31 87 36 80 38 C58 26 42 26 20 38 C13 36 10 31 14 26 Z"
              fill="#5B0E14"
              stroke="#8a1c24"
              strokeWidth="1.5"
            />
            {/* Blistered Leoparding Spots on Crust */}
            <circle cx="28" cy="24" r="2.5" fill="#240407" />
            <circle cx="48" cy="20" r="3" fill="#240407" />
            <circle cx="68" cy="22" r="2.5" fill="#240407" />
            <circle cx="80" cy="28" r="2" fill="#240407" />

            {/* Triangular Pizza Slice Body */}
            <path
              d="M18 36 C40 26 60 26 82 36 L52 90 C50 93 48 93 46 90 L18 36 Z"
              fill="#5B0E14"
              stroke="#3d070b"
              strokeWidth="1.5"
            />

            {/* Rich San Marzano Tomato Sauce Base */}
            <path
              d="M22 39 C40 31 60 31 78 39 L51 86 C50 88 48 88 47 86 L22 39 Z"
              fill="#9e1c25"
            />

            {/* Gooey Melted Fior Di Latte Mozzarella Layer in Warm Cream #f1e194 */}
            <path
              d="M24 41 C38 34 52 35 68 40 C62 47 68 53 60 62 C54 69 52 74 49 82 C46 76 40 68 36 60 C32 54 30 46 24 41 Z"
              fill="#f1e194"
              stroke="#d6c374"
              strokeWidth="0.8"
            />
            {/* Molten Cheese Bubbles & Highlights */}
            <circle cx="44" cy="48" r="3.5" fill="#ffffff" fillOpacity="0.8" />
            <circle cx="56" cy="54" r="3" fill="#ffffff" fillOpacity="0.75" />
            <ellipse cx="38" cy="58" rx="3.5" ry="2.5" fill="#d6c374" />

            {/* Fresh Basil Leaves */}
            <g transform="translate(42, 42) rotate(-22)">
              <path
                d="M0 0 C6 -6 16 -4 18 6 C12 12 4 8 0 0 Z"
                fill="#15803d"
                stroke="#14532d"
                strokeWidth="0.8"
              />
              <path d="M2 1 L14 4" stroke="#86efac" strokeWidth="0.6" />
            </g>
            <g transform="translate(48, 62) rotate(35)">
              <path
                d="M0 0 C5 -5 13 -3 15 5 C10 10 3 6 0 0 Z"
                fill="#166534"
                stroke="#14532d"
                strokeWidth="0.8"
              />
            </g>

            {/* Charred Cherry Tomato Slice */}
            <circle cx="34" cy="46" r="4.5" fill="#5B0E14" stroke="#8a1c24" strokeWidth="0.8" />
            <circle cx="33" cy="45" r="1.5" fill="#f87171" />
            <circle cx="35" cy="47" r="1" fill="#240407" />
          </svg>
        </div>
      </div>

      {/* 2. Hot Italian Espresso Cup & Saucer with Organic Steam */}
      <div className="relative group">
        {/* Animated Rising Steam Vapors above Espresso in White & Cream #f1e194 */}
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-20 h-16 pointer-events-none overflow-visible">
          <svg
            className="absolute bottom-0 left-3 w-7 h-14 text-[#f1e194]/45 animate-steam-2"
            viewBox="0 0 24 50"
            fill="none"
          >
            <path
              d="M12 50 C18 36 6 28 14 16 C20 8 10 3 14 0"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <svg
            className="absolute bottom-0 left-8 w-7 h-16 text-white/55 animate-steam-1"
            viewBox="0 0 24 55"
            fill="none"
          >
            <path
              d="M10 55 C4 40 16 30 8 18 C3 10 12 4 8 0"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Espresso Cup SVG */}
        <div className="relative filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]">
          <svg
            className="w-20 h-20 md:w-24 md:h-24 transition-transform duration-300 group-hover:scale-105"
            viewBox="0 0 90 90"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Saucer Shadow */}
            <ellipse cx="45" cy="80" rx="36" ry="6" fill="black" fillOpacity="0.6" />

            {/* Ceramic Saucer Plate in Pure White #ffffff & Gold Rim #f1e194 */}
            <ellipse cx="45" cy="74" rx="34" ry="7" fill="#ffffff" stroke="#f1e194" strokeWidth="1.2" />
            <ellipse cx="45" cy="73" rx="26" ry="4.5" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="0.8" />

            {/* Cup Handle */}
            <path
              d="M58 48 C72 48 72 64 58 64"
              stroke="#ffffff"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M58 48 C70 48 70 64 58 64"
              stroke="#f1e194"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
            />

            {/* Ceramic Cup Body in Pure White #ffffff with Deep Wine #5B0E14 Accent */}
            <path
              d="M26 44 C26 66 33 72 45 72 C57 72 64 66 64 44 Z"
              fill="#ffffff"
              stroke="#f1e194"
              strokeWidth="1.4"
            />
            {/* Deep Wine & Gold Filigree Stripes on Cup */}
            <path d="M27 49 Q45 53 63 49" stroke="#5B0E14" strokeWidth="1.5" fill="none" />
            <path d="M28 53 Q45 57 62 53" stroke="#f1e194" strokeWidth="1.2" fill="none" />

            {/* Cup Rim & Hot Dark Espresso with Golden Crema */}
            <ellipse cx="45" cy="44" rx="19" ry="7" fill="#ffffff" stroke="#f1e194" strokeWidth="1" />
            <ellipse cx="45" cy="44" rx="16.5" ry="5.5" fill="#1e0b06" />
            {/* Golden Crema Foam in Warm Cream #f1e194 */}
            <ellipse cx="45" cy="44" rx="15" ry="4.5" fill="#5B0E14" fillOpacity="0.9" />
            <ellipse cx="43" cy="43.5" rx="10" ry="3" fill="#f1e194" fillOpacity="0.95" />
            <path
              d="M40 43 C42 41 46 41 48 44"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
