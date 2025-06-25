"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, Ban } from 'lucide-react';
import { format } from 'date-fns';
import { useBlockedPeriods } from '@/hooks/useBlockedPeriods';
import { useToast } from '@/components/ui/use-toast';

interface BlockAvailabilityDialogProps {
  trailers: Array<{
    id: string;
    title: string;
  }>;
  selectedDate?: Date;
  trigger?: React.ReactNode;
}

export function BlockAvailabilityDialog({ 
  trailers, 
  selectedDate,
  trigger 
}: BlockAvailabilityDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(selectedDate);
  const [endDate, setEndDate] = useState<Date | undefined>(selectedDate);
  const [reason, setReason] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [morning, setMorning] = useState(false);
  const [afternoon, setAfternoon] = useState(false);
  const [evening, setEvening] = useState(false);
  const [selectedTrailer, setSelectedTrailer] = useState<string>('all');

  const { createBlockedPeriod, isCreating, createError } = useBlockedPeriods();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast({
        title: 'Datum vereist',
        description: 'Selecteer een start- en einddatum',
        variant: 'destructive',
      });
      return;
    }

    if (endDate < startDate) {
      toast({
        title: 'Ongeldige datums',
        description: 'Einddatum moet na startdatum zijn',
        variant: 'destructive',
      });
      return;
    }

    if (!allDay && !morning && !afternoon && !evening) {
      toast({
        title: 'Tijdslot vereist',
        description: 'Selecteer minimaal één tijdslot of kies voor hele dag',
        variant: 'destructive',
      });
      return;
    }

    try {
      createBlockedPeriod({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        reason: reason.trim() || undefined,
        allDay,
        morning,
        afternoon,
        evening,
        trailerId: selectedTrailer === 'all' ? undefined : selectedTrailer,
      });

      toast({
        title: 'Periode geblokkeerd',
        description: 'De geselecteerde periode is succesvol geblokkeerd',
      });

      // Reset form
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
      setAllDay(true);
      setMorning(false);
      setAfternoon(false);
      setEvening(false);
      setSelectedTrailer('all');
      setOpen(false);
    } catch (error) {
      toast({
        title: 'Fout bij blokkeren',
        description: createError?.message || 'Kon periode niet blokkeren',
        variant: 'destructive',
      });
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Ban className="w-4 h-4 mr-2" />
      Periode blokkeren
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Beschikbaarheid blokkeren</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Trailer Selection */}
          <div className="space-y-2">
            <Label>Aanhanger</Label>
            <Select value={selectedTrailer} onValueChange={setSelectedTrailer}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer aanhanger" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle aanhangers</SelectItem>
                {trailers.map((trailer) => (
                  <SelectItem key={trailer.id} value={trailer.id}>
                    {trailer.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Startdatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'dd/MM/yyyy') : 'Selecteer datum'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Einddatum</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'dd/MM/yyyy') : 'Selecteer datum'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center space-x-2">
            <Switch
              id="allDay"
              checked={allDay}
              onCheckedChange={setAllDay}
            />
            <Label htmlFor="allDay">Hele dag</Label>
          </div>

          {/* Time Slots (when not all day) */}
          {!allDay && (
            <div className="space-y-2">
              <Label className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Tijdsloten
              </Label>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="morning"
                    checked={morning}
                    onCheckedChange={setMorning}
                    size="sm"
                  />
                  <Label htmlFor="morning" className="text-sm">
                    Ochtend
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="afternoon"
                    checked={afternoon}
                    onCheckedChange={setAfternoon}
                    size="sm"
                  />
                  <Label htmlFor="afternoon" className="text-sm">
                    Middag
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="evening"
                    checked={evening}
                    onCheckedChange={setEvening}
                    size="sm"
                  />
                  <Label htmlFor="evening" className="text-sm">
                    Avond
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reden (optioneel)</Label>
            <Textarea
              id="reason"
              placeholder="Bijv. onderhoud, vakantie, reparatie..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
            >
              {isCreating ? 'Blokkeren...' : 'Blokkeren'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}