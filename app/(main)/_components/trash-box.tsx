"use client"

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";

export const TrashBox = () => {
  const router = useRouter() ;
  const params = useParams() ; 
  const documents = useQuery(api.documents.getTrash); 
  const restore = useMutation(api.documents.restore);
  const remove = useMutation(api.documents.remove);
  return (
    <div>
      <h1>TrashBox</h1>
    </div>
  );
} 

