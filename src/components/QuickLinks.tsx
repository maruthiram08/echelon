'use client';

import { ExternalLink } from 'lucide-react';

interface QuickLink {
    name: string;
    description: string;
    url: string;
    source: string;
}

const QUICK_LINKS: QuickLink[] = [
    {
        name: 'RBI Repo Rate',
        description: 'Current policy rate',
        url: 'https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx',
        source: 'RBI',
    },
    {
        name: '10Y G-Sec Yield',
        description: 'Government bonds',
        url: 'https://www.ccilindia.com/Research/Statistics/Pages/GSecYield.aspx',
        source: 'CCIL',
    },
    {
        name: 'FII/DII Flows',
        description: 'Institutional flows',
        url: 'https://www.nseindia.com/reports/fii-dii',
        source: 'NSE',
    },
    {
        name: 'CPI Inflation',
        description: 'Consumer prices',
        url: 'https://mospi.gov.in/publication/consumer-price-index',
        source: 'MOSPI',
    },
    {
        name: 'GDP Growth',
        description: 'Quarterly estimates',
        url: 'https://mospi.gov.in/publication/national-accounts',
        source: 'MOSPI',
    },
    {
        name: 'India PMI',
        description: 'Manufacturing & Services',
        url: 'https://tradingeconomics.com/india/manufacturing-pmi',
        source: 'S&P Global',
    },
    {
        name: 'Forex Reserves',
        description: 'Weekly reserves',
        url: 'https://www.rbi.org.in/Scripts/BS_ViewBulletin.aspx',
        source: 'RBI',
    },
    {
        name: 'Monsoon Update',
        description: 'Rainfall data',
        url: 'https://mausam.imd.gov.in/',
        source: 'IMD',
    },
];

export function QuickLinks() {
    return (
        <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                    <ExternalLink className="h-5 w-5" />
                </div>
                <div>
                    <h3 className="text-[20px] font-bold text-[#111111]">Quick Links</h3>
                    <p className="text-[#666666]">Official sources for granular data</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {QUICK_LINKS.map((link) => (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block p-5 rounded-[24px] bg-[#FAFAFA] hover:bg-[#FFF5E6] transition-all duration-300 transform hover:-translate-y-1"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="inline-block px-3 py-1 bg-white rounded-full text-[10px] font-bold text-gray-400 border border-gray-100 group-hover:border-[#E06D4E]/20 group-hover:text-[#E06D4E]">
                                {link.source}
                            </span>
                            <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-[#E06D4E] transition-colors" />
                        </div>

                        <p className="text-[15px] font-bold text-[#111111] mb-1 group-hover:text-[#E06D4E] transition-colors">
                            {link.name}
                        </p>
                        <p className="text-[12px] text-gray-500 line-clamp-1">
                            {link.description}
                        </p>
                    </a>
                ))}
            </div>
        </div>
    );
}
