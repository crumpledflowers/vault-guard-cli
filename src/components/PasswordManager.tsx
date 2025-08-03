import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Eye, EyeOff, Copy, Edit, Trash2, LogOut } from "lucide-react";

interface Password {
  id: string;
  website: string;
  username: string;
  password: string;
  notes?: string;
  created_at: string;
}

interface PasswordManagerProps {
  onSignOut: () => void;
}

export const PasswordManager = ({ onSignOut }: PasswordManagerProps) => {
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPassword, setEditingPassword] = useState<Password | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    website: "",
    username: "",
    password: "",
    notes: "",
  });

  useEffect(() => {
    fetchPasswords();
  }, []);

  const fetchPasswords = async () => {
    const { data, error } = await supabase
      .from('passwords')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load passwords",
        variant: "destructive",
      });
    } else {
      setPasswords(data || []);
    }
    setLoading(false);
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    const length = 16;
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password: result });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingPassword) {
      const { error } = await supabase
        .from('passwords')
        .update(formData)
        .eq('id', editingPassword.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update password",
          variant: "destructive",
        });
      } else {
        toast({ title: "Password updated successfully" });
        fetchPasswords();
        setEditingPassword(null);
      }
    } else {
      const { error } = await supabase
        .from('passwords')
        .insert([formData]);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to add password",
          variant: "destructive",
        });
      } else {
        toast({ title: "Password added successfully" });
        fetchPasswords();
        setIsAddDialogOpen(false);
      }
    }

    setFormData({ website: "", username: "", password: "", notes: "" });
  };

  const deletePassword = async (id: string) => {
    const { error } = await supabase
      .from('passwords')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete password",
        variant: "destructive",
      });
    } else {
      toast({ title: "Password deleted" });
      fetchPasswords();
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${type} copied to clipboard` });
  };

  const togglePasswordVisibility = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onSignOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">VaultGuard</h1>
            <p className="text-muted-foreground">Your secure password vault</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Password
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Password</DialogTitle>
                  <DialogDescription>
                    Store a new password securely in your vault
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="website">Website/Service</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="username">Username/Email</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="flex gap-2">
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                      <Button type="button" variant="outline" onClick={generatePassword}>
                        Generate
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full">Add Password</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <div className="grid gap-4">
          {passwords.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">No passwords stored yet</p>
                <p className="text-sm text-muted-foreground mt-2">Click "Add Password" to get started</p>
              </CardContent>
            </Card>
          ) : (
            passwords.map((password) => (
              <Card key={password.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{password.website}</CardTitle>
                      <CardDescription>{password.username}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingPassword(password);
                          setFormData({
                            website: password.website,
                            username: password.username,
                            password: password.password,
                            notes: password.notes || "",
                          });
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deletePassword(password.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Username</Badge>
                      <span className="font-mono text-sm">{password.username}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(password.username, "Username")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Password</Badge>
                      <span className="font-mono text-sm">
                        {showPasswords[password.id] ? password.password : "••••••••"}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => togglePasswordVisibility(password.id)}
                      >
                        {showPasswords[password.id] ? (
                          <EyeOff className="w-3 h-3" />
                        ) : (
                          <Eye className="w-3 h-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(password.password, "Password")}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    {password.notes && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">Notes</Badge>
                        <span className="text-sm text-muted-foreground">{password.notes}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {editingPassword && (
          <Dialog open={!!editingPassword} onOpenChange={() => setEditingPassword(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Password</DialogTitle>
                <DialogDescription>
                  Update your stored password information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="edit-website">Website/Service</Label>
                  <Input
                    id="edit-website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-username">Username/Email</Label>
                  <Input
                    id="edit-username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit-password">Password</Label>
                  <div className="flex gap-2">
                    <Input
                      id="edit-password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                    <Button type="button" variant="outline" onClick={generatePassword}>
                      Generate
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes (optional)</Label>
                  <Input
                    id="edit-notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">Update Password</Button>
                  <Button type="button" variant="outline" onClick={() => setEditingPassword(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};