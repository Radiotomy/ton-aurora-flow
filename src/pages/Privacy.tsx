import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 pt-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        <Card className="border-0 shadow-xl bg-card/90 backdrop-blur-xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
              Privacy Policy
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Effective Date: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-3">Blockchain Data</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>TON wallet addresses when you connect your wallet</li>
                <li>Transaction hashes and blockchain interaction data</li>
                <li>NFT ownership and marketplace activity</li>
                <li>Token balances and conversion history</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-3">Platform Usage Data</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                <li>Music listening history and preferences</li>
                <li>Artist interactions and fan club memberships</li>
                <li>Playlist creation and sharing activity</li>
                <li>Community participation (polls, comments)</li>
              </ul>

              <h3 className="text-lg font-medium text-foreground mb-3">Technical Information</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Device type and browser information</li>
                <li>IP address and approximate location</li>
                <li>Performance metrics and error logs</li>
                <li>Session data and platform interactions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide and improve platform services</li>
                <li>Process blockchain transactions and smart contract interactions</li>
                <li>Generate personalized music recommendations</li>
                <li>Enable social features and community interactions</li>
                <li>Analyze platform usage and performance</li>
                <li>Comply with legal obligations</li>
                <li>Communicate platform updates and security notices</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Data Sharing and Third Parties</h2>
              
              <h3 className="text-lg font-medium text-foreground mb-3">Audius Integration</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We integrate with Audius for music streaming and discovery. Music data and listening activity 
                may be shared with Audius in accordance with their privacy policy.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-3">Blockchain Networks</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Transaction data is inherently public on blockchain networks. Wallet addresses and transaction 
                hashes are visible to anyone with blockchain explorer access.
              </p>

              <h3 className="text-lg font-medium text-foreground mb-3">Service Providers</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Supabase for database and backend services</li>
                <li>TON blockchain infrastructure providers</li>
                <li>Analytics and monitoring services</li>
                <li>Content delivery networks</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>End-to-end encryption for sensitive communications</li>
                <li>Secure database access with row-level security</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Minimal data collection and retention policies</li>
                <li>Secure authentication and session management</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Your Privacy Rights</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Access your personal data we have collected</li>
                <li>Request correction of inaccurate information</li>
                <li>Delete your account and associated data</li>
                <li>Export your data in a portable format</li>
                <li>Opt out of non-essential data processing</li>
                <li>Withdraw consent for data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain personal data only as long as necessary for platform functionality and legal compliance. 
                Blockchain transaction data is permanent and cannot be deleted. Account data can be deleted upon request, 
                though some information may be retained for security and fraud prevention.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your data may be processed in countries other than your own. We ensure appropriate safeguards 
                are in place to protect your privacy rights in accordance with applicable data protection laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                AudioTon is not intended for users under 13 years of age. We do not knowingly collect personal 
                information from children under 13. If you believe a child has provided us with personal information, 
                please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Cookie Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Maintain your session and preferences</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content and recommendations</li>
                <li>Enable social media integration features</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Policy Updates</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy periodically to reflect changes in our practices or applicable laws. 
                We will notify users of significant changes through the platform or email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                For privacy-related questions or requests, please contact us through our official channels. 
                We are committed to addressing your privacy concerns promptly and transparently.
              </p>
            </section>

            <div className="mt-12 pt-8 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;