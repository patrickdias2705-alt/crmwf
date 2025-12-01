import { Badge } from '@/components/ui/badge';
import { 
  Globe, 
  Facebook, 
  Instagram, 
  MessageCircle,
  Tag,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

interface LeadTrackingInfoProps {
  origin?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  referrer_url?: string;
  ad_name?: string;
  variant?: 'default' | 'compact';
}

/**
 * Componente para exibir informações de rastreamento de origem do lead
 */
export function LeadTrackingInfo({ 
  origin,
  utm_source, 
  utm_medium,
  utm_campaign,
  utm_content,
  referrer_url,
  ad_name,
  variant = 'default'
}: LeadTrackingInfoProps) {
  
  // Se não houver dados de tracking, não renderizar nada
  if (!origin && !utm_source && !utm_campaign) {
    return null;
  }

  const getOriginIcon = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'instagram':
      case 'ig':
        return <Instagram className="h-3 w-3" />;
      case 'facebook':
      case 'fb':
        return <Facebook className="h-3 w-3" />;
      case 'whatsapp':
      case 'wa':
        return <MessageCircle className="h-3 w-3" />;
      case 'google':
      case 'google_ads':
        return <TrendingUp className="h-3 w-3" />;
      case 'site':
      case 'website':
        return <Globe className="h-3 w-3" />;
      default:
        return <Globe className="h-3 w-3" />;
    }
  };

  const getOriginColor = (source: string) => {
    switch (source?.toLowerCase()) {
      case 'instagram':
      case 'ig':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'facebook':
      case 'fb':
        return 'bg-blue-600 text-white';
      case 'whatsapp':
      case 'wa':
        return 'bg-green-600 text-white';
      case 'google':
      case 'google_ads':
        return 'bg-yellow-500 text-white';
      case 'site':
      case 'website':
        return 'bg-slate-600 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getMediumLabel = (medium?: string) => {
    if (!medium) return null;
    
    const labels: Record<string, string> = {
      'social': 'Rede Social',
      'cpc': 'Anúncio Pago',
      'paid': 'Pago',
      'organic': 'Orgânico',
      'referral': 'Indicação',
      'email': 'Email',
      'direct': 'Direto',
    };
    
    return labels[medium.toLowerCase()] || medium;
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {/* Origin Badge */}
        {(origin || utm_source) && (
          <Badge className={`text-xs flex items-center gap-1 ${getOriginColor(origin || utm_source || '')}`}>
            {getOriginIcon(origin || utm_source || '')}
            <span>{origin || utm_source}</span>
          </Badge>
        )}
        
        {/* Campaign */}
        {utm_campaign && (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {utm_campaign}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs">
      {/* Origin */}
      {(origin || utm_source) && (
        <div className="flex items-center gap-2">
          <Badge className={`${getOriginColor(origin || utm_source || '')}`}>
            {getOriginIcon(origin || utm_source || '')}
            <span className="ml-1 capitalize">
              {origin || utm_source}
            </span>
          </Badge>
          
          {/* Medium */}
          {utm_medium && (
            <Badge variant="secondary" className="text-xs">
              {getMediumLabel(utm_medium)}
            </Badge>
          )}
        </div>
      )}

      {/* Campaign */}
      {utm_campaign && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <Tag className="h-3 w-3" />
          <span className="font-medium">Campanha:</span>
          <span>{utm_campaign}</span>
        </div>
      )}

      {/* Ad Name */}
      {ad_name && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">Anúncio:</span>
          <span>{ad_name}</span>
        </div>
      )}

      {/* Content/Variation */}
      {utm_content && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <span className="font-medium">Variação:</span>
          <span>{utm_content}</span>
        </div>
      )}

      {/* Referrer */}
      {referrer_url && (
        <div className="flex items-center gap-1 text-muted-foreground">
          <ExternalLink className="h-3 w-3" />
          <a 
            href={referrer_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:text-primary truncate max-w-[200px]"
          >
            {new URL(referrer_url).hostname}
          </a>
        </div>
      )}
    </div>
  );
}

