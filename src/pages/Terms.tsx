import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Terms() {
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
              Terms of Service
            </CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-neutral dark:prose-invert max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="mb-4">
                By accessing and using AudioTon ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. Service Description</h2>
              <p className="mb-4">
                AudioTon is a Web3 music streaming platform that integrates TON blockchain technology with Audius Protocol to enable:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Music streaming and discovery</li>
                <li>NFT minting and collection</li>
                <li>Direct artist tipping via TON tokens</li>
                <li>Fan club memberships and exclusive content access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Wallet Connection and Transactions</h2>
              <p className="mb-4">
                To use Web3 features, you must connect a compatible TON wallet. You are responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Maintaining the security of your wallet and private keys</li>
                <li>All transactions initiated from your wallet</li>
                <li>Understanding the risks associated with blockchain transactions</li>
                <li>Transaction fees and gas costs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. Intellectual Property</h2>
              <p className="mb-4">
                Music content is provided through Audius Protocol. NFTs and related metadata are generated based on publicly available content. Users are responsible for ensuring they have rights to mint NFTs of specific content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Prohibited Activities</h2>
              <p className="mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 mb-4">
                <li>Use the service for illegal activities</li>
                <li>Attempt to manipulate or exploit smart contracts</li>
                <li>Infringe on intellectual property rights</li>
                <li>Engage in market manipulation or fraudulent activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Disclaimers</h2>
              <p className="mb-4">
                AudioTon is provided "as is" without warranties. We are not responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4">
                <li>Financial losses from trading or minting activities</li>
                <li>Smart contract vulnerabilities or exploits</li>
                <li>Third-party service interruptions (Audius, TON network)</li>
                <li>Loss of wallet access or private keys</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Changes to Terms</h2>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of updated terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Contact Information</h2>
              <p className="mb-4">
                For questions about these terms, please contact us through our official channels or community Discord.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}