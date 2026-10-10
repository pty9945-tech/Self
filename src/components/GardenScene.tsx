import { useId } from 'react'

type GardenSceneProps = {
  className?: string
}

const flowers: [number, number, number, string][] = [
  [360, 21, 17, '#F7D0CE'], [378, 9, 22, '#F6CFCE'],
  [399, 25, 23, '#F3BEC2'], [421, 13, 22, '#F8D9D3'],
  [441, 33, 23, '#F5C8CB'], [463, 16, 27, '#F9D9D5'],
  [484, 40, 26, '#F5C6C9'], [513, 17, 25, '#F9D7D2'],
  [535, 37, 27, '#F6CACC'], [561, 17, 28, '#F9D8D4'],
  [589, 33, 29, '#F6C9CD'], [613, 12, 27, '#F8D7D1'],
  [595, 68, 24, '#F8D5D0'], [619, 60, 25, '#F6C8C9'],
  [551, 69, 21, '#F4C1C6'], [524, 65, 20, '#F8D4D0'],
  [576, 88, 18, '#F6CDD0'], [464, 57, 18, '#F9D8D2'],
  [414, 49, 18, '#F8D2D0'], [389, 39, 14, '#F7D3D0'],
]

function Blossom({ x, y, radius, color }: { x: number; y: number; radius: number; color: string }) {
  return (
    <g transform={`translate(${x} ${y})`} fill={color}>
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cy={-radius * 0.39} rx={radius * 0.61} ry={radius * 0.62} transform={`rotate(${angle})`} />
      ))}
      <circle r={radius * 0.09} fill="#DDA1A8" opacity=".75" />
    </g>
  )
}

function TinyFlower({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} fill="#FFF8EF">
      {[0, 72, 144, 216, 288].map((angle) => (
        <ellipse key={angle} cy="-3.4" rx="2.8" ry="3.5" transform={`rotate(${angle})`} />
      ))}
      <circle r="1.5" fill="#D8979C" />
    </g>
  )
}

export default function GardenScene({ className }: GardenSceneProps) {
  const id = useId().replace(/:/g, '')

  return (
    <svg className={className} viewBox="0 0 640 330" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="320" y1="0" x2="320" y2="330" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0F5EE" stopOpacity=".25" />
          <stop offset="1" stopColor="#E5EEE2" />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="300" y1="206" x2="250" y2="325" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C5DCD5" />
          <stop offset="1" stopColor="#D8E8DF" />
        </linearGradient>
      </defs>

      {/* A quiet spring morning in a little Japanese garden. */}
      <path d="M34 207C40 95 124 44 227 47C312 1 456 17 535 77C586 115 614 205 608 291H35L34 207Z" fill={`url(#${id}-sky)`} />
      <circle cx="353" cy="93" r="48" fill="#F6DDD3" />
      <path d="M26 190L106 130L163 170L222 114L303 189L374 155L453 207H26V190Z" fill="#DDE7D9" />
      <path d="M189 144L222 114L253 143L238 141L224 146L216 138L204 145L189 144Z" fill="#FAFCF6" />
      <path d="M53 199C146 168 208 197 283 185C341 175 395 179 439 201C503 181 562 188 604 217V288H53V199Z" fill="#CCDCC9" />
      <path d="M16 249C76 220 146 222 195 230C262 207 341 210 399 226C477 197 557 216 626 257L610 302C533 326 100 326 30 299L16 249Z" fill="#E4ECDA" />
      <path d="M310 211C290 229 306 235 289 248C271 262 230 267 225 282C221 297 249 305 267 318C291 321 319 321 343 319C319 301 288 297 282 286C276 274 325 264 329 248C333 231 314 228 322 213L310 211Z" fill={`url(#${id}-water)`} />
      <g stroke="#F7FAF3" strokeWidth="2.5" strokeLinecap="round" opacity=".9">
        <path d="M283 259H302M251 279H270M285 299H306M306 238H316M257 309H281" />
      </g>

      {/* The wooden tea house, with gently upturned tile roofs. */}
      <g>
        <path d="M74 234H245L253 242H66L74 234Z" fill="#ACB4A0" />
        <path d="M87 230H233V236H87V230Z" fill="#D0B799" />
        <path d="M94 157H225V231H94V157Z" fill="#F5E5CC" />
        <path d="M99 155H106V232H99V155ZM214 155H221V232H214V155Z" fill="#A77860" />
        <path d="M117 178H150V220H117V178ZM166 178H201V220H166V178Z" fill="#BFA38A" />
        <path d="M121 182H146V216H121V182ZM170 182H197V216H170V182Z" fill="#E5DFC8" />
        <g stroke="#A9856B" strokeWidth="2">
          <path d="M134 181V216M120 193H147M120 204H147M183 181V216M170 193H197M170 204H197" />
        </g>
        <path d="M88 161H231V170H88V161Z" fill="#9D715D" />
        <path d="M159 99C145 118 113 134 73 137L70 147H248L242 137C207 134 176 118 159 99Z" fill="#789387" />
        <path d="M71 139C111 143 144 124 159 109C179 126 210 143 245 139" stroke="#566E65" strokeWidth="5" strokeLinecap="round" />
        <path d="M79 150C114 150 141 140 159 130C181 142 210 151 239 150L245 160H73L79 150Z" fill="#597569" />
        <path d="M78 160H241" stroke="#435B52" strokeWidth="4" strokeLinecap="round" />
        <g stroke="#A7B9A7" strokeWidth="1.5" opacity=".65">
          <path d="M107 137L111 143M122 132L127 139M140 121L144 127M175 122L171 129M191 132L187 140M209 138L206 145" />
        </g>
        <path d="M85 175H96M222 175H236" stroke="#926752" strokeWidth="3" strokeLinecap="round" />
        <path d="M89 175V182M230 175V182" stroke="#926752" strokeWidth="2" />
        <rect x="82" y="181" width="14" height="22" rx="7" fill="#D88276" />
        <rect x="223" y="181" width="14" height="22" rx="7" fill="#D88276" />
        <path d="M88 184V200M229 184V200" stroke="#ECAF9A" strokeWidth="2" />
        <path d="M122 233V241M196 233V241" stroke="#8E7360" strokeWidth="4" />
      </g>

      {/* Three tiers of a vermilion pagoda. */}
      <g>
        <path d="M433 243H533L541 250H424L433 243Z" fill="#ADB6A2" />
        <path d="M445 191H520V240H445V191Z" fill="#D88976" />
        <path d="M451 201H515V232H451V201Z" fill="#F1CCAC" />
        <path d="M456 151H509V186H456V151Z" fill="#D88774" />
        <path d="M462 157H504V183H462V157Z" fill="#F1CCAC" />
        <path d="M465 111H500V146H465V111Z" fill="#D88774" />
        <path d="M471 117H494V140H471V117Z" fill="#EFC9A9" />
        <g fill="#AD6456">
          <path d="M450 198H455V239H450V198ZM479 198H485V239H479V198ZM510 198H515V239H510V198ZM460 155H465V185H460V155ZM480 155H485V185H480V155ZM501 155H506V185H501V155ZM470 114H474V144H470V114ZM490 114H494V144H490V114Z" />
        </g>
        <path d="M482 72C473 90 455 97 442 96L439 105C456 112 508 112 526 104L522 96C508 97 491 87 482 72Z" fill="#6E877B" />
        <path d="M439 104C462 110 502 110 526 104" stroke="#4F695E" strokeWidth="4" strokeLinecap="round" />
        <path d="M482 119C469 133 448 137 430 135L426 145C453 154 512 154 539 144L535 135C515 137 496 132 482 119Z" fill="#718A7C" />
        <path d="M427 144C454 151 510 152 539 144" stroke="#4F695E" strokeWidth="4" strokeLinecap="round" />
        <path d="M482 165C466 181 440 183 418 180L413 190C444 201 520 201 552 190L547 180C524 183 499 178 482 165Z" fill="#789181" />
        <path d="M414 190C451 200 517 200 551 190" stroke="#4F695E" strokeWidth="4" strokeLinecap="round" />
        <path d="M440 232H526V240H440V232Z" fill="#C77F69" />
        <path d="M438 226H527M444 217V232M456 217V232M467 217V232M496 217V232M508 217V232M520 217V232" stroke="#B26E5D" strokeWidth="3" strokeLinecap="round" />
        <path d="M482 49V77" stroke="#81775E" strokeWidth="3" strokeLinecap="round" />
        <path d="M477 58H487M476 65H488M478 71H486" stroke="#81775E" strokeWidth="2" strokeLinecap="round" />
        <circle cx="482" cy="47" r="3" fill="#BBA777" />
      </g>

      {/* Flowering branches frame the upper edge. */}
      <path d="M567 269C554 224 560 173 575 122C582 93 588 49 603 6" stroke="#A9826A" strokeWidth="12" strokeLinecap="round" />
      <path d="M567 192C569 163 569 148 557 122C539 84 507 49 461 29C429 15 400 15 371 18" stroke="#A9826A" strokeWidth="8" strokeLinecap="round" />
      <path d="M552 115C553 84 548 60 531 36M503 54C477 60 452 53 435 43M581 99C596 83 610 75 627 75M582 87C573 55 576 35 587 18" stroke="#A9826A" strokeWidth="5" strokeLinecap="round" />
      {flowers.map(([x, y, radius, color], i) => <Blossom key={i} x={x} y={y} radius={radius} color={color} />)}
      <g opacity=".92">
        <TinyFlower x={400} y={22} scale={.8} />
        <TinyFlower x={441} y={31} scale={.7} />
        <TinyFlower x={482} y={39} scale={.8} />
        <TinyFlower x={512} y={14} scale={.8} />
        <TinyFlower x={551} y={67} scale={.8} />
        <TinyFlower x={592} y={37} scale={.85} />
        <TinyFlower x={619} y={60} scale={.7} />
        <TinyFlower x={574} y={88} scale={.65} />
        <TinyFlower x={466} y={17} scale={.65} />
      </g>

      {/* Round shrubs, stepping stones, and a tiny garden lantern. */}
      <path d="M23 268C19 251 32 243 44 248C43 229 64 224 74 238C79 219 100 223 104 240C118 233 135 245 129 261L23 268Z" fill="#B3C9A9" />
      <path d="M501 275C493 260 504 247 518 250C513 231 535 222 546 237C554 218 579 225 580 244C598 234 617 250 612 270L501 275Z" fill="#B3C8A9" />
      <path d="M44 254L46 268M80 245L84 267M551 246L550 275M584 256L578 272" stroke="#8FA983" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="165" cy="262" rx="17" ry="6" fill="#C6C9B7" />
      <ellipse cx="190" cy="272" rx="18" ry="6.5" fill="#CED0BE" />
      <ellipse cx="216" cy="285" rx="19" ry="7" fill="#C3C7B2" />
      <path d="M308 262H330L327 256H311L308 262Z" fill="#B8BCA8" />
      <path d="M315 235H323V257H315V235Z" fill="#BCC2AE" />
      <path d="M308 232H330V238H308V232Z" fill="#A8B49F" />
      <path d="M311 218H327V232H311V218Z" fill="#D1D5BF" />
      <path d="M317 221H322V228H317V221Z" fill="#F9E0AE" />
      <path d="M319 207C315 212 309 214 305 214L303 220H336L333 214C327 214 323 211 319 207Z" fill="#ABB8A2" />
      <circle cx="319" cy="205" r="3" fill="#ADB9A4" />

      {/* A book-loving maneki-neko welcomes the learner. */}
      <g>
        <ellipse cx="395" cy="288" rx="46" ry="8" fill="#B8C9AD" opacity=".55" />
        <path d="M425 272C447 273 451 259 444 253C438 248 433 252 433 257" stroke="#F9F3E4" strokeWidth="12" strokeLinecap="round" />
        <path d="M369 236C359 250 358 273 365 283C377 292 410 292 422 282C429 268 425 249 416 235L369 236Z" fill="#FFF9EA" stroke="#C9BFAA" strokeWidth="1.5" />
        <path d="M365 225C357 222 351 214 352 204C352 194 361 192 366 198C371 204 368 214 375 218" fill="#FFF9EA" stroke="#C9BFAA" strokeWidth="1.5" />
        <path d="M354 201L365 202M354 206L365 207" stroke="#D8C9B3" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M368 213L369 184C370 180 373 181 384 190C392 187 401 187 408 191L420 182C423 181 425 183 425 187L423 214C429 231 415 242 395 242C375 242 361 232 368 213Z" fill="#FFF9EA" stroke="#C9BFAA" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M373 195L374 187L382 194L373 195ZM412 195L420 187L420 200L412 195Z" fill="#E9AAA0" />
        <path d="M388 188C389 196 387 201 383 204C390 206 398 202 400 188C396 187 392 187 388 188Z" fill="#D1AF80" />
        <path d="M376 216C379 212 383 212 386 216M404 216C407 212 411 212 414 216" stroke="#6D6455" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="377" cy="222" rx="5.5" ry="3" fill="#F2C2B4" />
        <ellipse cx="413" cy="222" rx="5.5" ry="3" fill="#F2C2B4" />
        <path d="M392 220H398L395 223L392 220Z" fill="#BD8B7D" />
        <path d="M395 223V225C394 229 389 228 389 226M395 225C397 229 401 228 402 226" stroke="#6D6455" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M368 220L372 221M418 222L423 220M368 226L372 226M418 227L423 228" stroke="#AC9E87" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M374 239C386 244 404 244 416 239" stroke="#C96A5F" strokeWidth="5" strokeLinecap="round" />
        <circle cx="395" cy="245" r="5" fill="#DDAD60" />
        <path d="M395 243V247M393 247H397" stroke="#9E793D" strokeWidth="1" strokeLinecap="round" />
        <path d="M384 252L411 248L418 274L390 279L384 252Z" fill="#BA5E55" />
        <path d="M389 253L412 250L417 272L394 276L389 253Z" fill="#D38070" />
        <path d="M392 277L416 273" stroke="#FFF1D8" strokeWidth="2" strokeLinecap="round" />
        <path d="M400 258L402 268M397 261L406 260M398 265L407 264" stroke="#FBE6C8" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M369 254C373 251 380 254 386 258C391 262 387 269 382 267L373 263" fill="#FFF9EA" stroke="#C9BFAA" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M417 255C413 252 408 256 409 261C410 265 416 267 421 263" fill="#FFF9EA" stroke="#C9BFAA" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M368 282C372 279 379 279 384 282M405 283C409 280 416 279 420 281" stroke="#D8C9B3" strokeWidth="1.5" strokeLinecap="round" />
      </g>

      {/* A few drifting petals and flowers in the grass. */}
      <g fill="#EAAFAD">
        <path d="M295 113C294 104 302 99 305 101C308 106 303 112 295 113Z" />
        <path d="M339 158C341 151 349 150 351 154C350 159 345 161 339 158Z" />
        <path d="M527 125C524 117 529 112 533 113C537 119 533 124 527 125Z" />
        <path d="M593 169C584 169 581 163 584 160C590 159 595 164 593 169Z" />
        <path d="M269 188C264 183 266 177 270 177C275 179 275 185 269 188Z" />
        <path d="M474 276C466 274 466 269 470 267C476 268 478 272 474 276Z" />
        <path d="M121 281C119 276 124 273 128 275C129 280 126 283 121 281Z" />
        <path d="M352 298C356 293 362 295 363 298C360 303 355 303 352 298Z" />
        <path d="M562 294C556 291 557 287 561 286C567 288 567 292 562 294Z" />
      </g>
      <g stroke="#9DB28F" strokeWidth="1.8" strokeLinecap="round">
        <path d="M107 289V280M103 284L107 287L111 282M483 292V282M479 286L483 290L487 285M202 250V243M199 247L202 249L205 245" />
      </g>
      <TinyFlower x={107} y={277} scale={.65} />
      <TinyFlower x={483} y={279} scale={.7} />
      <circle cx="148" cy="291" r="2" fill="#E7C78C" />
      <circle cx="499" cy="304" r="2" fill="#E7C78C" />
      <circle cx="77" cy="277" r="1.6" fill="#E7C78C" />
    </svg>
  )
}
