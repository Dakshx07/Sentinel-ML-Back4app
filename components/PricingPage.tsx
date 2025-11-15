import React, { useState } from 'react';
import { AppView, DashboardView } from '../types';
import { CheckIcon, XIcon } from './icons';
import { motion } from 'framer-motion';

interface PricingPageProps {
  onNavigate: (view: AppView | DashboardView) => void;
}

const plans = [
    {
        name: 'Free',
        description: 'For individuals and open-source projects getting started.',
        price: { monthly: 0, yearly: 0 },
        features: [
            'Core AI Analysis',
            'Unlimited Public Repos',
            'Studio Sandbox',
            '1 User',
        ],
        cta: 'Get Started',
        action: 'repositories',
        isPopular: false,
    },
    {
        name: 'Team',
        description: 'For professional teams building commercial software.',
        price: { monthly: 10, yearly: 8 },
        features: [
            'All Free features, plus:',
            'Unlimited Private Repos',
            'Contextual Code Analysis',
            'CI/CD Integration',
            'Priority Support',
        ],
        cta: 'Start Free Trial',
        action: 'repositories',
        isPopular: true,
    },
    {
        name: 'Enterprise',
        description: 'For large organizations with advanced security & compliance needs.',
        price: { monthly: 'Custom', yearly: 'Custom' },
        features: [
            'All Team features, plus:',
            'On-Premise Deployment',
            'SAML/SSO Integration',
            'Dedicated Support & SLA',
            'Compliance Reporting',
        ],
        cta: 'Contact Sales',
        action: 'mailto:sales@sentinel-ai.example',
        isPopular: false,
    }
];

const featureComparison = [
  { feature: "Core AI Analysis", free: true, team: true, enterprise: true },
  { feature: "Unlimited Public Repositories", free: true, team: true, enterprise: true },
  { feature: "Studio Sandbox", free: true, team: true, enterprise: true },
  { feature: "Users", free: "1", team: "Up to 50", enterprise: "Custom" },
  { feature: "Private Repositories", free: false, team: true, enterprise: true },
  { feature: "Contextual Code Analysis", free: false, team: true, enterprise: true },
  { feature: "CI/CD Integration", free: false, team: true, enterprise: true },
  { feature: "Priority Support", free: false, team: true, enterprise: true },
  { feature: "SAML/SSO Integration", free: false, team: false, enterprise: true },
  { feature: "On-Premise Deployment", free: false, team: false, enterprise: true },
  { feature: "Compliance Reporting", free: false, team: false, enterprise: true },
];

interface FeatureRowProps {
    feature: string;
    free: boolean | string;
    team: boolean | string;
    enterprise: boolean | string;
}

const FeatureRow: React.FC<FeatureRowProps> = ({ feature, free, team, enterprise }) => (
    <tr className="border-b border-gray-200 dark:border-white/10 last:border-b-0 even:bg-light-primary/50 dark:even:bg-dark-primary/50 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
        <td className="py-4 px-6 text-left font-semibold text-dark-text dark:text-light-text">{feature}</td>
        <td className="py-4 px-6 text-center">
            {typeof free === 'string' ? <span className="text-dark-text dark:text-light-text font-semibold">{free}</span> : free ? <CheckIcon className="w-6 h-6 text-brand-cyan mx-auto" /> : <XIcon className="w-6 h-6 text-gray-400 dark:text-medium-text/50 mx-auto" />}
        </td>
        <td className="py-4 px-6 text-center border-x border-gray-200 dark:border-white/10">
            {typeof team === 'string' ? <span className="text-dark-text dark:text-light-text font-semibold">{team}</span> : team ? <CheckIcon className="w-6 h-6 text-brand-cyan mx-auto" /> : <XIcon className="w-6 h-6 text-gray-400 dark:text-medium-text/50 mx-auto" />}
        </td>
        <td className="py-4 px-6 text-center">
            {typeof enterprise === 'string' ? <span className="text-dark-text dark:text-light-text font-semibold">{enterprise}</span> : enterprise ? <CheckIcon className="w-6 h-6 text-brand-cyan mx-auto" /> : <XIcon className="w-6 h-6 text-gray-400 dark:text-medium-text/50 mx-auto" />}
        </td>
    </tr>
);


const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <main className="pt-24 pb-12 font-sans bg-light-secondary dark:bg-dark-secondary animate-fade-in">
            <section className="max-w-7xl mx-auto px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-dark-text dark:text-white font-heading">Transparent Pricing</h1>
                    <p className="text-lg text-medium-dark-text dark:text-medium-text mt-4 mb-10">Choose a plan that scales with your team's needs. No hidden fees.</p>
                </div>
                
                <div className="flex justify-center items-center space-x-4 mb-12">
                    <span className={`font-semibold transition-colors ${billingCycle === 'monthly' ? 'text-dark-text dark:text-white' : 'text-medium-dark-text dark:text-medium-text'}`}>Monthly</span>
                    <div onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} className="w-12 h-7 flex items-center bg-gray-200 dark:bg-dark-primary rounded-full p-1 cursor-pointer transition-colors">
                        <motion.div layout className="w-5 h-5 bg-brand-purple rounded-full shadow-md" />
                    </div>
                    <span className={`font-semibold transition-colors ${billingCycle === 'yearly' ? 'text-dark-text dark:text-white' : 'text-medium-dark-text dark:text-medium-text'}`}>Yearly</span>
                    <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">Save 20%</span>
                </div>
                
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative p-8 rounded-2xl flex flex-col group transition-all duration-300 hover:shadow-2xl hover:shadow-brand-purple/20 hover:-translate-y-2 ${plan.isPopular ? 'bg-light-secondary dark:bg-dark-secondary border-2 border-brand-purple' : 'bg-light-primary dark:bg-dark-primary border border-gray-200 dark:border-white/10 hover:border-brand-purple/50'}`}
                        >
                            {plan.isPopular && <span className="absolute top-0 -translate-y-1/2 bg-brand-purple text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>}
                            
                            <h3 className="text-2xl font-bold text-dark-text dark:text-white font-heading">{plan.name}</h3>
                            <p className="text-medium-dark-text dark:text-medium-text mt-2 h-12">{plan.description}</p>
                            
                            <div className="my-8">
                                {typeof plan.price.monthly === 'number' ? (
                                    <>
                                        <span className="text-5xl font-bold text-dark-text dark:text-white">${billingCycle === 'monthly' ? plan.price.monthly : plan.price.yearly}</span>
                                        <span className="text-lg font-normal text-medium-dark-text dark:text-medium-text"> / user / month</span>
                                    </>
                                ) : (
                                    <span className="text-5xl font-bold text-dark-text dark:text-white">Custom</span>
                                )}
                            </div>

                            <ul className="space-y-3 mb-8 text-sm">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-start space-x-3">
                                        <CheckIcon className="w-5 h-5 text-brand-cyan flex-shrink-0 mt-0.5" />
                                        <span className="text-medium-dark-text dark:text-medium-text">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-auto pt-6">
                                {plan.action.startsWith('mailto:') ? (
                                    <a href={plan.action} className="w-full btn-outline">
                                        <span className="block py-3">{plan.cta}</span>
                                    </a>
                                ) : (
                                    <button 
                                        onClick={() => onNavigate(plan.action as DashboardView)} 
                                        className={`w-full ${plan.isPopular ? 'btn-primary' : 'btn-outline'}`}
                                    >
                                        {plan.isPopular ? (
                                            plan.cta
                                        ) : (
                                            <span className="block py-3">{plan.cta}</span>
                                        )}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            <section className="max-w-7xl mx-auto px-6 mt-24">
                <h2 className="text-4xl font-bold text-dark-text dark:text-white text-center font-heading mb-12">Full Feature Comparison</h2>
                <div className="max-w-6xl mx-auto bg-light-secondary dark:bg-dark-secondary rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-light-primary/50 dark:bg-dark-primary/50">
                                <tr className="border-b border-gray-200 dark:border-white/10">
                                    <th className="py-5 px-6 text-left font-bold text-dark-text dark:text-white font-heading uppercase tracking-wider text-base">Features</th>
                                    <th className="py-5 px-6 font-bold text-dark-text dark:text-white font-heading uppercase tracking-wider text-base">Free</th>
                                    <th className="py-5 px-6 font-bold text-dark-text dark:text-white font-heading uppercase tracking-wider text-base border-x border-gray-200 dark:border-white/10">Team</th>
                                    <th className="py-5 px-6 font-bold text-dark-text dark:text-white font-heading uppercase tracking-wider text-base">Enterprise</th>
                                </tr>
                            </thead>
                            <tbody>
                                {featureComparison.map(f => (
                                    <FeatureRow
                                        key={f.feature}
                                        feature={f.feature}
                                        free={f.free}
                                        team={f.team}
                                        enterprise={f.enterprise}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    );
};

export default PricingPage;