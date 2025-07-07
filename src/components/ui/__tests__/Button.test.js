import { render, screen, fireEvent } from '@testing-library/react';
import Button from '../Button';

describe('Button コンポーネント', () => {
  test('基本的なレンダリングが正常に動作する', () => {
    render(<Button>テストボタン</Button>);
    
    const button = screen.getByRole('button', { name: 'テストボタン' });
    expect(button).toBeInTheDocument();
  });

  test('onClick イベントが正常に動作する', () => {
    const mockOnClick = jest.fn();
    render(<Button onClick={mockOnClick}>クリック</Button>);
    
    const button = screen.getByRole('button', { name: 'クリック' });
    fireEvent.click(button);
    
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  test('disabled 状態が正常に動作する', () => {
    const mockOnClick = jest.fn();
    render(
      <Button disabled onClick={mockOnClick}>
        無効ボタン
      </Button>
    );
    
    const button = screen.getByRole('button', { name: '無効ボタン' });
    expect(button).toBeDisabled();
    
    fireEvent.click(button);
    expect(mockOnClick).not.toHaveBeenCalled();
  });

  test('variant プロパティが正常に適用される', () => {
    render(<Button variant="danger">危険ボタン</Button>);
    
    const button = screen.getByRole('button', { name: '危険ボタン' });
    expect(button).toHaveClass('bg-red-600');
  });

  test('size プロパティが正常に適用される', () => {
    render(<Button size="lg">大きなボタン</Button>);
    
    const button = screen.getByRole('button', { name: '大きなボタン' });
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  test('カスタムクラスが適用される', () => {
    render(<Button className="custom-class">カスタムボタン</Button>);
    
    const button = screen.getByRole('button', { name: 'カスタムボタン' });
    expect(button).toHaveClass('custom-class');
  });

  test('type プロパティが正常に設定される', () => {
    render(<Button type="submit">送信</Button>);
    
    const button = screen.getByRole('button', { name: '送信' });
    expect(button).toHaveAttribute('type', 'submit');
  });
}); 