import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4">
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
              Terms of Service
            </CardTitle>
            <p className="text-muted-foreground mt-2">
              Effective Date: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          
          <CardContent className="prose prose-slate dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using AudioTon ("the Platform"), you agree to be bound by these Terms of Service. 
                AudioTon is a Web3 music platform that connects artists and fans through blockchain technology, 
                integrating Audius streaming with TON blockchain payments and NFTs.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">2. Platform Description</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                AudioTon provides:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Music streaming and discovery via Audius integration</li>
                <li>TON blockchain wallet connectivity</li>
                <li>Artist tipping and fan club memberships</li>
                <li>NFT minting and marketplace functionality</li>
                <li>Token conversion between TON and $AUDIO</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">3. Wallet and Blockchain Interactions</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Users must connect a compatible TON wallet to access platform features. By connecting your wallet, you acknowledge:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>You are responsible for wallet security and private key management</li>
                <li>All blockchain transactions are irreversible</li>
                <li>Network fees may apply to transactions</li>
                <li>Smart contract interactions carry inherent risks</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">4. User Responsibilities</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Comply with all applicable laws and regulations</li>
                <li>Respect intellectual property rights</li>
                <li>Maintain account security</li>
                <li>Use platform features responsibly</li>
                <li>Report any security vulnerabilities or abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">5. Prohibited Activities</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Uploading copyrighted content without permission</li>
                <li>Attempting to manipulate or exploit platform features</li>
                <li>Engaging in fraudulent transactions</li>
                <li>Harassing or abusing other users</li>
                <li>Circumventing security measures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">6. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                Artists retain ownership of their uploaded content. By using the platform, artists grant AudioTon 
                a license to display, distribute, and promote their content within the platform ecosystem.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                AudioTon is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service, 
                the security of smart contracts, or the value of tokens and NFTs.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                AudioTon shall not be liable for any direct, indirect, incidental, or consequential damages arising 
                from platform use, including but not limited to loss of funds, data, or opportunities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">9. Modifications</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify these terms at any time. Continued use of the platform constitutes 
                acceptance of updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-4">10. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about these terms, please contact us through our official channels or GitHub repository.
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

export default Terms;