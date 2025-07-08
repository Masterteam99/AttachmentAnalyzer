import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DashboardStats from '../DashboardStats';

describe('DashboardStats', () => {
  it('renderizza correttamente le statistiche di default', () => {
    render(<DashboardStats />);
    
    // Verifica che tutti i titoli delle statistiche siano presenti
    expect(screen.getByText('Weekly Goal')).toBeTruthy();
    expect(screen.getByText('Current Streak')).toBeTruthy();
    expect(screen.getByText('Total Workouts')).toBeTruthy();
    expect(screen.getByText('Calories Burned')).toBeTruthy();
  });

  it('renderizza correttamente i dati forniti', () => {
    const mockData = {
      currentStreak: 5,
      totalWorkouts: 15,
      totalCaloriesBurned: 1200,
      weeklyProgress: 3,
      weeklyGoal: 4
    };

    render(<DashboardStats data={mockData} />);
    
    expect(screen.getByText('5 days')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
    expect(screen.getByText('1,200')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
  });

  it('gestisce correttamente i dati mancanti', () => {
    render(<DashboardStats />);
    
    // Dovrebbe mostrare valori di default
    expect(screen.getByText('0%')).toBeTruthy();
    expect(screen.getByText('0 days')).toBeTruthy();
    expect(screen.getByText('0', { selector: 'p' })).toBeTruthy();
  });
});
