import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 p-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Privacy Policy
            </CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
              <p className="mb-4">AudioTon collects the following types of information:</p>
              
              <h3 className="text-lg font-medium mb-2">Wallet Information</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>TON wallet addresses (public information)</li>
                <li>Transaction hashes and blockchain interactions</li>
                <li>NFT holdings and collection data</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Usage Data</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Music listening history and preferences</li>
                <li>App usage analytics and performance metrics</li>
                <li>Device information and browser type</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Profile Information</h3>
              <ul className="list-disc pl-6 mb-4">
                <li>Display names and profile customizations</li>
                <li>Fan club memberships and activity</li>
                <li>Social interactions within the platform</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
              <p className="mb-4">We use collected information to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Provide and improve our music streaming services</li>
                <li>Process blockchain transactions and NFT operations</li>
                <li>Personalize your music discovery experience</li>
                <li>Maintain platform security and prevent fraud</li>
                <li>Analyze usage patterns and optimize performance</li>
                <li>Communicate important updates and features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Data Storage and Security</h2>
              <p className="mb-4">
                Your data is stored securely using industry-standard practices:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Blockchain data is stored on the TON network (immutable and public)</li>
                <li>Profile and usage data is encrypted and stored in secure databases</li>
                <li>We implement regular security audits and monitoring</li>
                <li>Access to personal data is restricted to authorized personnel only</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Third-Party Integrations</h2>
              <p className="mb-4">AudioTon integrates with third-party services:</p>
              
              <h3 className="text-lg font-medium mb-2">Audius Protocol</h3>
              <p className="mb-2">
                Music content and metadata are retrieved from Audius. Please review Audius's privacy policy for their data practices.
              </p>

              <h3 className="text-lg font-medium mb-2">TON Blockchain</h3>
              <p className="mb-2">
                Wallet addresses and transactions are public on the TON blockchain and cannot be deleted or modified.
              </p>

              <h3 className="text-lg font-medium mb-2">Analytics Services</h3>
              <p className="mb-2">
                We use privacy-focused analytics to understand app usage and improve user experience.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Your Rights and Choices</h2>
              <p className="mb-4">You have the following rights regarding your data:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Access and export your profile data</li>
                <li>Update or correct your profile information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of non-essential data collection</li>
                <li>Control your privacy settings and preferences</li>
              </ul>
              <p className="mb-4">
                Note: Blockchain transactions cannot be deleted due to the immutable nature of distributed ledgers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Data Sharing and Disclosure</h2>
              <p className="mb-4">We do not sell your personal data. We may share information in these situations:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>With your explicit consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and prevent fraud</li>
                <li>In connection with business transactions (mergers, acquisitions)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Children's Privacy</h2>
              <p className="mb-4">
                AudioTon is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Changes to This Policy</h2>
              <p className="mb-4">
                We may update this privacy policy periodically. We will notify users of significant changes through the app or email.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
              <p className="mb-4">
                For privacy-related questions or to exercise your rights, please contact us through our official support channels.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}