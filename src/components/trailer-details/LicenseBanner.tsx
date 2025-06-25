import { Card, CardContent } from "../ui/card";
import { IdCard, Info } from "lucide-react";

export default function LicenseBanner() {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-3 text-gray-700">
        Rijbewijsverplichting
      </h3>
      <Card className="border-0 rounded-md bg-[#f6f8f9] shadow-none p-0 mt-4 w-full">
        <CardContent className="flex items-center gap-3 p-2">
          <div className="flex items-center gap-3 bg-[#f6f8f9] p-3 rounded-md">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md">
              <IdCard className="size-5" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                Let op! Voor dit type aanhanger is een speciaal rijbewijs type
                vereist
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
