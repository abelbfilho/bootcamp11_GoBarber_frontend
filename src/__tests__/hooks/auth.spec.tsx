import { renderHook, act } from '@testing-library/react-hooks';
import MockAdapter from 'axios-mock-adapter';

import { useAuth, AuthProvider } from '../../hooks/auth';
import api from '../../services/api';

const apiMock = new MockAdapter(api);

describe('Auth hook', () => {
  it('should be able to signIn', async () => {
    const apiResponse = {
      user: {
        id: '1',
        name: 'John X Doe',
        email: 'johnxdoe@example.com',
      },
      token: 'fake-token',
    };

    apiMock.onPost('sessions').reply(200, apiResponse);

    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

    const { result, waitForNextUpdate } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    result.current.signIn({
      email: 'johnxdoe@example.com',
      password: '12345678',
    });

    await waitForNextUpdate();

    expect(result.current.user.email).toEqual('johnxdoe@example.com');
    expect(setItemSpy).toHaveBeenCalledWith(
      '@GoBarber:token',
      apiResponse.token,
    );
    expect(setItemSpy).toHaveBeenCalledWith(
      '@GoBarber:user',
      JSON.stringify(apiResponse.user),
    );
  });

  it('should restore saved data from storage when auth inits', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      switch (key) {
        case '@GoBarber:token':
          return 'valid-token';
        case '@GoBarber:user':
          return JSON.stringify({
            id: '1',
            name: 'John X Doe',
            email: 'johnxdoe@example.com',
          });
        default:
          return null;
      }
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    expect(result.current.user.email).toEqual('johnxdoe@example.com');
  });

  it('should be able to sign out', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
      switch (key) {
        case '@GoBarber:token':
          return 'valid-token';
        case '@GoBarber:user':
          return JSON.stringify({
            id: '1',
            name: 'John X Doe',
            email: 'johnxdoe@example.com',
          });
        default:
          return null;
      }
    });

    const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem');

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });
    act(() => {
      result.current.signOut();
    });

    expect(result.current.user).toBeUndefined();
    expect(removeItemSpy).toHaveBeenCalledTimes(2);
  });

  it('should be able to update user data', async () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider,
    });

    const user = {
      id: '1',
      name: 'John X Doe',
      email: 'johnxdoe@example.com',
      avatar_url: 'avatar_url',
    };

    act(() => {
      result.current.updateUser(user);
    });

    expect(setItemSpy).toHaveBeenCalledWith(
      '@GoBarber:user',
      JSON.stringify(user),
    );
    expect(result.current.user).toEqual(user);
  });
});
