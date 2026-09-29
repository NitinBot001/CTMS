import React from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ModulePlaceholderPageProps {
  moduleName: string;
  plannedSegment: string;
  description: string;
  capabilities: string[];
}

export const ModulePlaceholderPage: React.FC<ModulePlaceholderPageProps> = ({
  moduleName,
  plannedSegment,
  description,
  capabilities,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-heading text-ink">{moduleName}</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Module scheduled for upcoming implementation segment
          </p>
        </div>
        <Link to="/pi/dashboard">
          <Button variant="outline" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Overview
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader
          title={`${moduleName} Module Specification`}
          subtitle={`Segment Schedule: ${plannedSegment}`}
          action={
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 bg-amber-50 text-accent-dark border border-amber-200 rounded-sm">
              <Clock className="w-3.5 h-3.5 text-accent" />
              {plannedSegment}
            </span>
          }
        />
        <CardContent className="space-y-4">
          <p className="text-sm text-ink-secondary leading-relaxed">{description}</p>

          <div className="pt-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-2">
              Planned Clinical Operations Capabilities:
            </h4>
            <ul className="space-y-1.5 text-xs text-ink">
              {capabilities.map((cap, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
