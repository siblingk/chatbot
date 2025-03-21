import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Shop } from "@/types/organization";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslations } from "next-intl";

interface ShopSearchProps {
  shops: Shop[];
  organizationSlug: string;
}

export function ShopSearch({ shops, organizationSlug }: ShopSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredShops, setFilteredShops] = useState<Shop[]>(shops);
  const t = useTranslations("ShopSearch");

  // Filtrar tiendas cuando cambia el término de búsqueda
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredShops(shops);
      return;
    }

    const filtered = shops.filter((shop) =>
      shop.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredShops(filtered);
  }, [searchTerm, shops]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("searchPlaceholder")}
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredShops.length > 0 ? (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {filteredShops.map((shop) => (
            <Link
              key={shop.id}
              href={`/organizations/${organizationSlug}/shops/${shop.id}`}
              className="block"
            >
              <Card className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-3">
                  <div className="text-sm font-medium">{shop.name}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground py-2">
          {t("noShopsFound")}
        </div>
      )}
    </div>
  );
}
