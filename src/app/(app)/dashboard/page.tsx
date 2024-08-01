"use client"

import { useToast } from "@/components/ui/use-toast";
import {  useCallback, useEffect, useState } from "react"
import { Messages } from "@/models/user";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { acceptMessageSchema } from "@/schemas/acceptMessageSchema";
import axios, { AxiosError } from "axios";
import { ApiResponse } from "@/types/apiResponse";
import { Button } from '@/components/ui/button';
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { MessageCard } from "@/components/MessageCard";
import { Loader2, RefreshCcw } from "lucide-react";
import { User } from "next-auth";

const Dashboard = () => {

  const[messages , setMessages] = useState<Messages[]>([]);
  const[isLoading , setIsLoading] = useState(false);
  const [isSwitchLoading , setIsSwitchLoading] = useState(false);
  const {toast} = useToast();

  const handelDeleteMessage = (messageID :string) =>{
     
     setMessages(messages.filter((message) => message._id !== messageID))
  }

  const {data:session} =useSession();

  const form = useForm({
     resolver : zodResolver(acceptMessageSchema)
  })

  const {register , watch , setValue} = form;

  const acceptMessages = watch("acceptMessages");

  const fetchAcceptMessages = useCallback(async()=>{
    setIsSwitchLoading(true)

    try {
     const response =  await axios.get<ApiResponse>("/api/accept-message")
     setValue('acceptMessages',response.data.isAcceptingMessages)
    } catch (error) {
      const axiosError =  error as AxiosError<ApiResponse>;
      toast({
        title : "ERROR",
        description: axiosError.response?.data.message || "Failed to fetch",
        variant : "destructive"
      })
    } finally{
      setIsSwitchLoading(false);
    }



  },[setValue])

  const fetchMessage = useCallback( async (refresh : boolean = false)=>{
    setIsLoading(true);
    setIsSwitchLoading(false);
    try {
      const response =  await axios.get<ApiResponse>("/api/get-messages")
      setMessages(response.data.messages || []);
      if(refresh){
        toast({
          title : "SUCCESS",
          description: "Messages refreshed",
        })
      
      }

    } catch (error) {
      const axiosError =  error as AxiosError<ApiResponse>;
      toast({
        title : "ERROR",
        description: axiosError.response?.data.message || "Failed to fetch",
        variant : "destructive"
      })
    } finally{
      setIsLoading(false);
      setIsSwitchLoading(false);
    }
  },[setIsLoading , setMessages])

  useEffect(()=>{

    if(!session || !session.user){
      return;
    }

    fetchMessage();
    fetchAcceptMessages();


  }, [session , setValue ,fetchAcceptMessages,fetchMessage])


  const handleSwitchChange = async()=>{
    try {
     const response =  await axios.post<ApiResponse>("/api/accept-message",{
        acceptMessages : !acceptMessages}
        )

        setValue("acceptMessages" , !acceptMessages)
        toast({
          title : response.data.message,
          variant : "default",
        })
    } 
    
    
    catch (error) {

      const axiosError =  error as AxiosError<ApiResponse>;
      toast({
        title : "ERROR",
        description: axiosError.response?.data.message || "Failed to fetch",
        variant : "destructive"
      })
      
    }
  }

  const {username} =  session?.user as User

  const baseUrl = `${window.location.protocol}//${window.location.host}`

  const profileUrl = `${baseUrl}/u/${username}`

  const copyToClipboard = ()=>{
    navigator.clipboard.writeText(profileUrl)
    toast({
      title : "Link Copied",
      variant : "default",
    })
  }

  if(!session || !session.user){
    return <div>loading...</div>
  }

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">User Dashboard</h1>

      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Copy Your Unique Link</h2>{' '}
        <div className="flex items-center">
          <input
            type="text"
            value={profileUrl}
            disabled
            className="input input-bordered w-full p-2 mr-2"
          />
          <Button onClick={copyToClipboard}>Copy</Button>
        </div>
      </div>

      <div className="mb-4">
        <Switch
          {...register('acceptMessages')}
          checked={acceptMessages}
          onCheckedChange={handleSwitchChange}
          disabled={isSwitchLoading}
        />
        <span className="ml-2">
          Accept Messages: {acceptMessages ? 'On' : 'Off'}
        </span>
      </div>
      <Separator />

      <Button
        className="mt-4"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          fetchMessage(true);
        }}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCcw className="h-4 w-4" />
        )}
      </Button>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <MessageCard
              key={message._id as string}
              message={message}
              onMessageDelete={handelDeleteMessage}
            />
          ))
        ) : (
          <p>No messages to display.</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard