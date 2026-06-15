import Image from "next/image";
import type { CachedRecipeStep } from "@/lib/types";

export function StepCard({ step }: { step: CachedRecipeStep }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-black/10 bg-white p-4 sm:flex-row">
      <div className="flex shrink-0 items-start gap-3 sm:w-48">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-sm font-semibold text-white">
          {step.step_number}
        </span>
        {step.image_url ? (
          <div className="relative h-24 w-full overflow-hidden rounded-lg bg-black/5 sm:h-28">
            <Image
              src={step.image_url}
              alt=""
              fill
              sizes="192px"
              className="object-cover"
            />
          </div>
        ) : null}
      </div>

      <div className="flex-1 space-y-2">
        <p className="text-sm leading-relaxed">{step.description}</p>
        {step.ingredient_images.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {step.ingredient_images.map((src, index) => (
              <div
                key={`${src}-${index}`}
                className="relative h-10 w-10 overflow-hidden rounded-md bg-black/5"
              >
                <Image src={src} alt="" fill sizes="40px" className="object-cover" />
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </li>
  );
}
