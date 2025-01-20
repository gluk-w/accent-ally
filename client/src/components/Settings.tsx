import { useState, useEffect } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Settings {
  language: string;
  pwaName: string;
  pwaShortName: string;
  pwaThemeColor: string;
}

export function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({
    language: 'american',
    pwaName: 'AccentAlly',
    pwaShortName: 'AccentAlly',
    pwaThemeColor: '#000000'
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('accentAllySettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  // Save settings to localStorage and update manifest
  const updateSettings = async (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    localStorage.setItem('accentAllySettings', JSON.stringify(updatedSettings));

    // Update manifest.json with new PWA settings
    try {
      const manifest = {
        name: updatedSettings.pwaName,
        short_name: updatedSettings.pwaShortName,
        theme_color: updatedSettings.pwaThemeColor,
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      };

      // Trigger PWA update
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          registration.update();
        }
      }

      toast({
        title: "Settings Updated",
        description: "Settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="ml-2">
          <Settings2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language Variant</Label>
            <Select
              value={settings.language}
              onValueChange={(value) => updateSettings({ language: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language variant" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="american">American</SelectItem>
                <SelectItem value="australian">Australian</SelectItem>
                <SelectItem value="british">British</SelectItem>
                <SelectItem value="canadian">Canadian</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* PWA Settings */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-4">PWA Settings</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pwa-name">App Name</Label>
                <Input
                  id="pwa-name"
                  value={settings.pwaName}
                  onChange={(e) => updateSettings({ pwaName: e.target.value })}
                  placeholder="Enter app name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwa-short-name">Short Name</Label>
                <Input
                  id="pwa-short-name"
                  value={settings.pwaShortName}
                  onChange={(e) => updateSettings({ pwaShortName: e.target.value })}
                  placeholder="Enter short name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pwa-theme-color">Theme Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="pwa-theme-color"
                    type="color"
                    value={settings.pwaThemeColor}
                    onChange={(e) => updateSettings({ pwaThemeColor: e.target.value })}
                    className="w-16 p-1 h-10"
                  />
                  <Input
                    type="text"
                    value={settings.pwaThemeColor}
                    onChange={(e) => updateSettings({ pwaThemeColor: e.target.value })}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}